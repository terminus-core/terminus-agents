// =============================================================================
// TERMINUS AGENT - WebSocket Client
// =============================================================================

import WebSocket from 'ws';
import chalk from 'chalk';
import { ethers } from 'ethers';
import { AgentConfig } from '../config/store.js';
import { AgentExecutor } from '../agent/executor.js';

interface AuthMessage {
    type: 'AUTH';
    traceId: string;
    timestamp: number;
    payload: {
        nodeId: string;
        capabilities: string[];
        agentTypes: string[];
        wallet: string;
        walletSignature?: string;  // Signature proving wallet ownership
        specs: {
            os: string;
            arch: string;
            cpuCores: number;
            totalMemoryGB: number;
            nodeVersion: string;
        };
        secret: string;
        version: string;
    };
}

interface HeartbeatMessage {
    type: 'HEARTBEAT';
    traceId: string;
    timestamp: number;
    payload: {
        status: 'IDLE' | 'BUSY';
        cpuUsage: number;
        memoryUsage: number;
        activeJobs: number;
    };
}

interface AgentJobMessage {
    type: 'AGENT_JOB';
    traceId: string;
    timestamp: number;
    payload: {
        jobId: string;
        agentType: string;
        userQuery: string;
        context?: {
            conversationId?: string;
            previousMessages?: Array<{ role: string; content: string }>;
        };
    };
}

export class AgentClient {
    private ws: WebSocket | null = null;
    private config: AgentConfig;
    private executor: AgentExecutor;
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private reconnectAttempts = 0;
    private activeJobs = 0;

    constructor(config: AgentConfig) {
        this.config = config;
        this.executor = new AgentExecutor(config);
    }

    async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            console.log(chalk.gray(`🔌 Connecting to ${this.config.controlPlaneUrl}...`));

            this.ws = new WebSocket(this.config.controlPlaneUrl);

            this.ws.on('open', () => {
                console.log(chalk.green('✅ Connected! Sending AUTH...'));
                this.sendAuth();
                this.reconnectAttempts = 0;
            });

            this.ws.on('message', (data) => {
                this.handleMessage(data.toString());
            });

            this.ws.on('close', () => {
                console.log(chalk.yellow('❌ Disconnected from Control Plane'));
                this.stopHeartbeat();
                this.scheduleReconnect();
            });

            this.ws.on('error', (err) => {
                console.log(chalk.red(`Socket error: ${err.message}`));
            });

            resolve();
        });
    }

    disconnect(): void {
        this.stopHeartbeat();
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    private async sendAuth(): Promise<void> {
        // Sign the auth message with private key to prove wallet ownership
        let walletSignature: string | undefined;

        if (this.config.privateKey) {
            try {
                const wallet = new ethers.Wallet(this.config.privateKey);
                const message = `terminus-auth:${this.config.nodeId}`;
                walletSignature = await wallet.signMessage(message);
                console.log(chalk.green('🔐 Wallet signature generated'));
            } catch (err) {
                console.log(chalk.red(`Failed to sign auth message: ${(err as Error).message}`));
            }
        }

        const message: AuthMessage = {
            type: 'AUTH',
            traceId: this.generateTraceId(),
            timestamp: Date.now(),
            payload: {
                nodeId: this.config.nodeId,
                capabilities: ['agent-execution', 'llm-inference'],
                agentTypes: [this.config.agentType],
                wallet: this.config.wallet,
                walletSignature,
                specs: {
                    os: process.platform,
                    arch: process.arch,
                    cpuCores: 4,
                    totalMemoryGB: 8,
                    nodeVersion: process.version,
                },
                secret: 'terminus-dev-secret', // Must match control plane NODE_SECRET
                version: '0.1.0',
            },
        };

        this.send(message);
    }

    private handleMessage(raw: string): void {
        try {
            const message = JSON.parse(raw);

            switch (message.type) {
                case 'AUTH_ACK':
                    if (message.payload.success) {
                        console.log(chalk.green(`🎉 Authenticated as ${this.config.nodeId}`));
                        this.startHeartbeat(message.payload.heartbeatInterval || 5000);
                    } else {
                        console.log(chalk.red(`❌ Auth failed: ${message.payload.message}`));
                    }
                    break;

                case 'HEARTBEAT_ACK':
                    // Silently acknowledge
                    break;

                case 'AGENT_JOB':
                    this.handleAgentJob(message as AgentJobMessage);
                    break;

                case 'ERROR':
                    console.log(chalk.red(`❌ Error: ${message.payload.message}`));
                    break;

                default:
                    console.log(chalk.gray(`Unknown message: ${message.type}`));
            }
        } catch (err) {
            console.log(chalk.red(`Failed to parse message: ${raw.slice(0, 100)}`));
        }
    }

    private async handleAgentJob(message: AgentJobMessage): Promise<void> {
        const { jobId, agentType, userQuery } = message.payload;

        console.log(chalk.cyan(`📥 Job ${jobId}: "${userQuery.slice(0, 50)}..."`));

        this.activeJobs++;

        try {
            const startTime = Date.now();
            const result = await this.executor.execute(userQuery);
            const durationMs = Date.now() - startTime;

            console.log(chalk.green(`✅ Job ${jobId} complete (${durationMs}ms)`));

            this.send({
                type: 'AGENT_JOB_RESULT',
                traceId: message.traceId,
                timestamp: Date.now(),
                payload: {
                    jobId,
                    success: true,
                    response: result.response,
                    toolsUsed: result.toolsUsed,
                    metrics: {
                        executionTimeMs: durationMs,
                    },
                },
            });
        } catch (err) {
            const error = err as Error;
            console.log(chalk.red(`❌ Job ${jobId} failed: ${error.message}`));

            this.send({
                type: 'AGENT_JOB_RESULT',
                traceId: message.traceId,
                timestamp: Date.now(),
                payload: {
                    jobId,
                    success: false,
                    response: '',
                    error: {
                        code: 'EXECUTION_ERROR',
                        message: error.message,
                    },
                },
            });
        } finally {
            this.activeJobs--;
        }
    }

    private startHeartbeat(intervalMs: number): void {
        console.log(chalk.gray(`⏱️ Starting heartbeat every ${intervalMs}ms`));

        this.heartbeatInterval = setInterval(() => {
            const status = this.activeJobs > 0 ? 'BUSY' : 'IDLE';

            const message: HeartbeatMessage = {
                type: 'HEARTBEAT',
                traceId: this.generateTraceId(),
                timestamp: Date.now(),
                payload: {
                    status,
                    cpuUsage: 10,
                    memoryUsage: 30,
                    activeJobs: this.activeJobs,
                },
            };

            this.send(message);
            console.log(chalk.gray(`💓 Heartbeat (${status}, ${this.activeJobs} jobs)`));
        }, intervalMs);
    }

    private stopHeartbeat(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    private scheduleReconnect(): void {
        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);

        console.log(chalk.gray(`🔄 Reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts})...`));

        setTimeout(() => {
            this.connect();
        }, delay);
    }

    private send(message: unknown): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }

    private generateTraceId(): string {
        return `trace-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }
}
