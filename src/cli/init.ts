// =============================================================================
// TERMINUS AGENT - Init Command
// =============================================================================

import inquirer from 'inquirer';
import chalk from 'chalk';
import { saveConfig, generateNodeId, getConfigPath } from '../config/store.js';
import { checkOllamaAvailable, listOllamaModels } from '../llm/provider.js';
import { AGENTS } from '../agents/index.js';

// Available agent types (dynamically loaded from agents registry)
const AGENT_TYPES = AGENTS.map(agent => ({
    name: `${agent.name} - ${agent.description}`,
    value: agent.id,
}));

// LLM Provider options
const LLM_PROVIDERS = [
    { name: '🌐 Grok API (xAI Cloud)', value: 'grok' },
    { name: '🦙 Ollama (Local LLM)', value: 'ollama' },
    { name: '🔧 OpenAI-Compatible (LM Studio, LocalAI, etc.)', value: 'openai-compatible' },
];

export async function initCommand(): Promise<void> {
    console.log(chalk.cyan('\n🚀 Terminus Agent Setup\n'));

    // Check if Ollama is available
    const ollamaAvailable = await checkOllamaAvailable();
    let ollamaModels: string[] = [];
    if (ollamaAvailable) {
        ollamaModels = await listOllamaModels();
        console.log(chalk.green(`✅ Ollama detected with ${ollamaModels.length} models available\n`));
    }

    // Basic agent config
    const basicAnswers = await inquirer.prompt([
        {
            type: 'list',
            name: 'agentType',
            message: 'Select agent type:',
            choices: AGENT_TYPES,
        },
        {
            type: 'input',
            name: 'wallet',
            message: 'Enter your wallet address (for payments):',
            validate: (input: string) => {
                if (!input.startsWith('0x') || input.length !== 42) {
                    return 'Please enter a valid Ethereum address (0x...)';
                }
                return true;
            },
        },
        {
            type: 'password',
            name: 'privateKey',
            message: 'Enter wallet private key (for NFT verification):',
            mask: '*',
            validate: (input: string) => {
                if (input && !input.startsWith('0x')) {
                    return 'Private key should start with 0x (or leave empty to skip)';
                }
                return true;
            },
        },
    ]);

    // LLM Provider selection
    const llmAnswers = await inquirer.prompt([
        {
            type: 'list',
            name: 'llmProvider',
            message: 'Select LLM provider:',
            choices: LLM_PROVIDERS,
        },
    ]);

    let apiKey = '';
    let llmBaseUrl = '';
    let llmModel = '';

    // Provider-specific questions
    if (llmAnswers.llmProvider === 'grok') {
        const grokAnswers = await inquirer.prompt([
            {
                type: 'password',
                name: 'apiKey',
                message: 'Enter your Grok API key:',
                mask: '*',
                validate: (input: string) => {
                    if (!input.startsWith('xai-')) {
                        return 'Please enter a valid xAI API key (starts with xai-)';
                    }
                    return true;
                },
            },
        ]);
        apiKey = grokAnswers.apiKey;
    } else if (llmAnswers.llmProvider === 'ollama') {
        const ollamaAnswers = await inquirer.prompt([
            {
                type: 'input',
                name: 'baseUrl',
                message: 'Ollama server URL:',
                default: 'http://localhost:11434',
            },
            {
                type: ollamaModels.length > 0 ? 'list' : 'input',
                name: 'model',
                message: 'Select/Enter model:',
                choices: ollamaModels.length > 0 ? ollamaModels : undefined,
                default: ollamaModels[0] || 'llama3',
            },
        ]);
        llmBaseUrl = ollamaAnswers.baseUrl;
        llmModel = ollamaAnswers.model;
        apiKey = 'local-llm'; // Placeholder for validation
    } else if (llmAnswers.llmProvider === 'openai-compatible') {
        const openaiAnswers = await inquirer.prompt([
            {
                type: 'input',
                name: 'baseUrl',
                message: 'OpenAI-compatible server URL:',
                default: 'http://localhost:1234',
            },
            {
                type: 'input',
                name: 'model',
                message: 'Model name:',
                default: 'local-model',
            },
            {
                type: 'password',
                name: 'apiKey',
                message: 'API key (if required, else press enter):',
                mask: '*',
            },
        ]);
        llmBaseUrl = openaiAnswers.baseUrl;
        llmModel = openaiAnswers.model;
        apiKey = openaiAnswers.apiKey || 'not-required';
    }

    // Control plane URL
    const networkAnswers = await inquirer.prompt([
        {
            type: 'input',
            name: 'controlPlaneUrl',
            message: 'Control Plane URL:',
            default: 'ws://localhost:8081',
        },
    ]);

    const config = {
        agentType: basicAnswers.agentType,
        wallet: basicAnswers.wallet,
        privateKey: basicAnswers.privateKey || undefined,
        apiKey,
        controlPlaneUrl: networkAnswers.controlPlaneUrl,
        nodeId: generateNodeId(basicAnswers.agentType, basicAnswers.wallet),
        llmProvider: llmAnswers.llmProvider as 'grok' | 'ollama' | 'openai-compatible',
        llmBaseUrl: llmBaseUrl || undefined,
        llmModel: llmModel || undefined,
    };

    saveConfig(config);

    console.log(chalk.green('\n✅ Configuration saved!'));
    console.log(chalk.gray(`   Location: ${getConfigPath()}`));
    console.log(chalk.gray(`   Node ID: ${config.nodeId}`));
    console.log(chalk.gray(`   Agent: ${config.agentType}`));
    console.log(chalk.gray(`   LLM Provider: ${config.llmProvider}`));
    if (config.llmModel) {
        console.log(chalk.gray(`   Model: ${config.llmModel}`));
    }
    if (config.privateKey) {
        console.log(chalk.yellow('   ⚠️  Private key stored - use a dedicated wallet!'));
    }
    console.log(chalk.cyan('\nRun `terminus-agent run` to start.\n'));
}
