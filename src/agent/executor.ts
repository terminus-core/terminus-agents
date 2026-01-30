// =============================================================================
// TERMINUS AGENT - Agent Executor
// =============================================================================
// Executes agent logic: calls LLM, invokes tools, returns response.
// Supports multiple LLM backends via provider abstraction.
// =============================================================================

import { AgentConfig } from '../config/store.js';
import { LLMProvider, createLLMProvider } from '../llm/provider.js';
import { AGENTS, getAgentById, executeAgentTool, type AgentDefinition } from '../agents/index.js';

export interface ExecutionResult {
    response: string;
    toolsUsed?: Array<{
        name: string;
        params: unknown;
        result: unknown;
    }>;
    llmProvider?: string;
    tokensUsed?: number;
}

export class AgentExecutor {
    private config: AgentConfig;
    private agentDefinition: AgentDefinition;
    private llmProvider: LLMProvider;

    constructor(config: AgentConfig) {
        this.config = config;

        // Get agent definition from registry
        const agentDef = getAgentById(config.agentType);
        if (!agentDef) {
            throw new Error(`Unknown agent type: ${config.agentType}. Available: ${AGENTS.map(a => a.id).join(', ')}`);
        }
        this.agentDefinition = agentDef;

        // Create LLM provider based on config
        this.llmProvider = createLLMProvider({
            provider: config.llmProvider || 'grok',
            apiKey: config.apiKey,
            baseUrl: config.llmBaseUrl,
            model: config.llmModel,
        });

        console.log(`🤖 Agent executor initialized`);
        console.log(`   Agent: ${this.agentDefinition.name} (${this.agentDefinition.id})`);
        console.log(`   LLM Provider: ${this.llmProvider.name}`);
        console.log(`   Tools: ${this.agentDefinition.tools.map(t => t.name).join(', ')}`);
    }

    getAgentInfo(): { id: string; name: string; description: string; tools: string[] } {
        return {
            id: this.agentDefinition.id,
            name: this.agentDefinition.name,
            description: this.agentDefinition.description,
            tools: this.agentDefinition.tools.map(t => t.name),
        };
    }

    async execute(userQuery: string): Promise<ExecutionResult> {
        const toolsUsed: Array<{ name: string; params: unknown; result: unknown }> = [];

        // Build system prompt with tools info
        const toolsInfo = this.agentDefinition.tools
            .map(t => `- ${t.name}: ${t.description} (params: ${t.parameters.join(', ')})`)
            .join('\n');

        const systemPrompt = `${this.agentDefinition.systemPrompt}

You have access to the following tools:
${toolsInfo}

When you need to use a tool, respond with a JSON block like this:
\`\`\`json
{"tool": "toolName", "params": {"param1": "value1"}}
\`\`\`

After receiving tool results, incorporate them into your response to help the user.`;

        // Initial LLM call
        let response = await this.llmProvider.chat(
            [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userQuery },
            ],
            { maxTokens: 1024, temperature: 0.7 }
        );

        // Check if LLM wants to use a tool
        const toolMatch = response.content.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if (toolMatch) {
            try {
                const toolCall = JSON.parse(toolMatch[1]) as { tool: string; params: Record<string, unknown> };
                console.log(`🔧 Tool call detected: ${toolCall.tool}`);

                // Execute the tool
                const toolResult = await executeAgentTool(
                    this.agentDefinition.id,
                    toolCall.tool,
                    toolCall.params
                );

                toolsUsed.push({
                    name: toolCall.tool,
                    params: toolCall.params,
                    result: toolResult.data,
                });

                // Follow-up LLM call with tool result
                const followUp = await this.llmProvider.chat(
                    [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userQuery },
                        { role: 'assistant', content: response.content },
                        { role: 'user', content: `Tool result for ${toolCall.tool}:\n${JSON.stringify(toolResult.data, null, 2)}\n\nPlease provide a helpful response based on this information.` },
                    ],
                    { maxTokens: 1024, temperature: 0.7 }
                );

                response = followUp;
            } catch (e) {
                console.error('Failed to parse tool call:', e);
            }
        }

        return {
            response: response.content,
            toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
            llmProvider: this.llmProvider.name,
            tokensUsed: response.tokensUsed,
        };
    }
}
