// =============================================================================
// TERMINUS AGENT - LLM Provider Interface
// =============================================================================
// Abstraction layer for different LLM backends.
// Supports: xAI Grok (API), Ollama (local), OpenAI-compatible (local/cloud)
// =============================================================================

export interface LLMMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface LLMResponse {
    content: string;
    model: string;
    tokensUsed?: number;
}

export interface LLMProviderConfig {
    provider: 'grok' | 'ollama' | 'openai-compatible';
    apiKey?: string;         // For Grok/OpenAI
    baseUrl?: string;        // For Ollama/OpenAI-compatible (e.g., http://localhost:11434)
    model?: string;          // Model name (e.g., llama3, gpt-4, etc.)
}

export interface LLMProvider {
    name: string;
    chat(messages: LLMMessage[], options?: { maxTokens?: number; temperature?: number }): Promise<LLMResponse>;
}

// =============================================================================
// xAI Grok Provider
// =============================================================================

export class GrokProvider implements LLMProvider {
    name = 'grok';
    private apiKey: string;
    private model: string;

    constructor(apiKey: string, model = 'grok-4-1-fast-non-reasoning') {
        this.apiKey = apiKey;
        this.model = model;
    }

    async chat(messages: LLMMessage[], options?: { maxTokens?: number; temperature?: number }): Promise<LLMResponse> {
        const response = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: this.model,
                messages,
                max_tokens: options?.maxTokens ?? 1024,
                temperature: options?.temperature ?? 0.7,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Grok API error: ${response.status} - ${error}`);
        }

        const data = await response.json() as {
            choices: Array<{ message: { content: string } }>;
            usage?: { total_tokens: number };
        };

        return {
            content: data.choices[0]?.message?.content || '',
            model: this.model,
            tokensUsed: data.usage?.total_tokens,
        };
    }
}

// =============================================================================
// Ollama Provider (Local LLM)
// =============================================================================

export class OllamaProvider implements LLMProvider {
    name = 'ollama';
    private baseUrl: string;
    private model: string;

    constructor(baseUrl = 'http://localhost:11434', model = 'llama3') {
        this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
        this.model = model;
    }

    async chat(messages: LLMMessage[], options?: { maxTokens?: number; temperature?: number }): Promise<LLMResponse> {
        // Ollama uses /api/chat endpoint
        const response = await fetch(`${this.baseUrl}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: this.model,
                messages,
                stream: false,
                options: {
                    num_predict: options?.maxTokens ?? 1024,
                    temperature: options?.temperature ?? 0.7,
                },
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Ollama error: ${response.status} - ${error}`);
        }

        const data = await response.json() as {
            message: { content: string };
            eval_count?: number;
            prompt_eval_count?: number;
        };

        return {
            content: data.message?.content || '',
            model: this.model,
            tokensUsed: (data.eval_count || 0) + (data.prompt_eval_count || 0),
        };
    }
}

// =============================================================================
// OpenAI-Compatible Provider (LM Studio, LocalAI, vLLM, etc.)
// =============================================================================

export class OpenAICompatibleProvider implements LLMProvider {
    name = 'openai-compatible';
    private baseUrl: string;
    private apiKey: string;
    private model: string;

    constructor(baseUrl: string, model: string, apiKey = 'not-needed') {
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.model = model;
        this.apiKey = apiKey;
    }

    async chat(messages: LLMMessage[], options?: { maxTokens?: number; temperature?: number }): Promise<LLMResponse> {
        const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: this.model,
                messages,
                max_tokens: options?.maxTokens ?? 1024,
                temperature: options?.temperature ?? 0.7,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenAI-compatible API error: ${response.status} - ${error}`);
        }

        const data = await response.json() as {
            choices: Array<{ message: { content: string } }>;
            usage?: { total_tokens: number };
        };

        return {
            content: data.choices[0]?.message?.content || '',
            model: this.model,
            tokensUsed: data.usage?.total_tokens,
        };
    }
}

// =============================================================================
// Factory Function
// =============================================================================

export function createLLMProvider(config: LLMProviderConfig): LLMProvider {
    switch (config.provider) {
        case 'grok':
            if (!config.apiKey) {
                throw new Error('Grok provider requires apiKey');
            }
            return new GrokProvider(config.apiKey, config.model);

        case 'ollama':
            return new OllamaProvider(
                config.baseUrl || 'http://localhost:11434',
                config.model || 'llama3'
            );

        case 'openai-compatible':
            if (!config.baseUrl) {
                throw new Error('OpenAI-compatible provider requires baseUrl');
            }
            return new OpenAICompatibleProvider(
                config.baseUrl,
                config.model || 'gpt-3.5-turbo',
                config.apiKey
            );

        default:
            throw new Error(`Unknown LLM provider: ${config.provider}`);
    }
}

// =============================================================================
// Helper to detect Ollama availability
// =============================================================================

export async function checkOllamaAvailable(baseUrl = 'http://localhost:11434'): Promise<boolean> {
    try {
        const response = await fetch(`${baseUrl}/api/tags`, { method: 'GET' });
        return response.ok;
    } catch {
        return false;
    }
}

export async function listOllamaModels(baseUrl = 'http://localhost:11434'): Promise<string[]> {
    try {
        const response = await fetch(`${baseUrl}/api/tags`, { method: 'GET' });
        if (!response.ok) return [];

        const data = await response.json() as { models: Array<{ name: string }> };
        return data.models?.map(m => m.name) || [];
    } catch {
        return [];
    }
}
