// =============================================================================
// TERMINUS AGENT - Config Store
// =============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export interface AgentConfig {
    agentType: string;
    wallet: string;
    privateKey?: string;  // Private key for signing auth messages (proves wallet ownership)
    apiKey: string;       // Required for Grok, optional for local LLMs
    controlPlaneUrl: string;
    nodeId: string;

    // LLM Provider Configuration
    llmProvider?: 'grok' | 'ollama' | 'openai-compatible';  // Default: 'grok'
    llmBaseUrl?: string;   // For Ollama: http://localhost:11434, for LM Studio: http://localhost:1234
    llmModel?: string;     // Model name (e.g., 'llama3', 'mistral', 'codellama')
}

const CONFIG_DIR = join(homedir(), '.terminus');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export function getConfigPath(): string {
    return CONFIG_FILE;
}

export function configExists(): boolean {
    return existsSync(CONFIG_FILE);
}

export function loadConfig(): AgentConfig | null {
    if (!existsSync(CONFIG_FILE)) {
        return null;
    }

    try {
        const content = readFileSync(CONFIG_FILE, 'utf-8');
        return JSON.parse(content) as AgentConfig;
    } catch {
        return null;
    }
}

export function saveConfig(config: AgentConfig): void {
    if (!existsSync(CONFIG_DIR)) {
        mkdirSync(CONFIG_DIR, { recursive: true });
    }

    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function generateNodeId(agentType: string, wallet: string): string {
    // Create readable node ID: agentType-walletPrefix
    // Example: health-advisor-0x78f8
    const walletPrefix = wallet.slice(0, 6).toLowerCase();
    return `${agentType}-${walletPrefix}`;
}
