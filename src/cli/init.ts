// =============================================================================
// TERMINUS AGENT - Init Command (Enhanced UX)
// =============================================================================

import inquirer from 'inquirer';
import chalk from 'chalk';
import { saveConfig, generateNodeId, getConfigPath, configExists, loadConfig } from '../config/store.js';
import { checkOllamaAvailable, listOllamaModels } from '../llm/provider.js';
import { AGENTS } from '../agents/index.js';

// =============================================================================
// CLI Design Constants
// =============================================================================

const BANNER = `
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   ████████╗███████╗██████╗ ███╗   ███╗██╗███╗   ██╗██╗   ██╗███████╗   ║
║   ╚══██╔══╝██╔════╝██╔══██╗████╗ ████║██║████╗  ██║██║   ██║██╔════╝   ║
║      ██║   █████╗  ██████╔╝██╔████╔██║██║██╔██╗ ██║██║   ██║███████╗   ║
║      ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║██║██║╚██╗██║██║   ██║╚════██║   ║
║      ██║   ███████╗██║  ██║██║ ╚═╝ ██║██║██║ ╚████║╚██████╔╝███████║   ║
║      ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝   ║
║                                                                   ║
║                    🤖 Agent Node Setup Wizard                     ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
`;

const STEPS = ['Agent Type', 'Wallet', 'LLM Provider', 'Network'];

function printBanner(): void {
    console.clear();
    console.log(chalk.cyan(BANNER));
}

function printStep(current: number, total: number, title: string): void {
    const progress = STEPS.map((step, i) => {
        if (i < current) return chalk.green(`✓ ${step}`);
        if (i === current) return chalk.cyan(`▶ ${step}`);
        return chalk.gray(`○ ${step}`);
    }).join('  │  ');

    console.log('\n' + chalk.bgBlue.white.bold(` STEP ${current + 1}/${total}: ${title.toUpperCase()} `) + '\n');
    console.log(chalk.gray('  ' + progress) + '\n');
}

function printSection(title: string): void {
    console.log(chalk.yellow(`\n┌${'─'.repeat(title.length + 4)}┐`));
    console.log(chalk.yellow(`│  ${title}  │`));
    console.log(chalk.yellow(`└${'─'.repeat(title.length + 4)}┘\n`));
}

function printSuccess(message: string): void {
    console.log(chalk.bgGreen.black.bold(' ✓ SUCCESS ') + ' ' + chalk.green(message));
}

function printWarning(message: string): void {
    console.log(chalk.bgYellow.black.bold(' ⚠ WARNING ') + ' ' + chalk.yellow(message));
}

function printInfo(label: string, value: string): void {
    console.log(chalk.gray(`   ${label}: `) + chalk.white(value));
}

function printDivider(): void {
    console.log(chalk.gray('\n' + '─'.repeat(60) + '\n'));
}

// =============================================================================
// Agent Type Choices (with emojis)
// =============================================================================

const AGENT_EMOJIS: Record<string, string> = {
    'travel-planner': '✈️',
    'budget-planner': '💰',
    'health-advisor': '🏥',
    'fundamental-analyst': '📊',
    'technical-analyst': '📈',
    'crypto-advisor': '🪙',
    'food-expert': '🍳',
    'fitness-coach': '💪',
    'legal-advisor': '⚖️',
    'real-estate': '🏠',
    'career-coach': '💼',
    'event-planner': '🎉',
    'tech-support': '🔧',
    'shopping-assistant': '🛒',
    'language-tutor': '🌍',
};

const AGENT_CHOICES = AGENTS.map(agent => ({
    name: `${AGENT_EMOJIS[agent.id] || '🤖'} ${agent.name.padEnd(22)} ${chalk.gray(agent.description)}`,
    value: agent.id,
    short: agent.name,
}));

// =============================================================================
// LLM Provider Choices (with descriptions)
// =============================================================================

const LLM_CHOICES = [
    {
        name: `🌐 ${chalk.bold('Grok API')}       ${chalk.gray('xAI Cloud - Best quality, requires API key')}`,
        value: 'grok',
        short: 'Grok API',
    },
    {
        name: `🦙 ${chalk.bold('Ollama')}         ${chalk.gray('Local LLM - Free, runs on your machine')}`,
        value: 'ollama',
        short: 'Ollama (Local)',
    },
    {
        name: `🔧 ${chalk.bold('OpenAI-Compatible')}  ${chalk.gray('LM Studio, LocalAI, vLLM, etc.')}`,
        value: 'openai-compatible',
        short: 'OpenAI-Compatible',
    },
];

// =============================================================================
// Main Init Command
// =============================================================================

export async function initCommand(): Promise<void> {
    printBanner();

    // Check for existing config
    if (configExists()) {
        const existing = loadConfig();
        console.log(chalk.yellow('⚠️  Existing configuration found:\n'));
        if (existing) {
            printInfo('Agent', existing.agentType);
            printInfo('Wallet', existing.wallet);
            printInfo('LLM', existing.llmProvider || 'grok');
        }
        console.log();

        const { overwrite } = await inquirer.prompt([{
            type: 'confirm',
            name: 'overwrite',
            message: chalk.yellow('Overwrite existing configuration?'),
            default: false,
        }]);

        if (!overwrite) {
            console.log(chalk.gray('\nSetup cancelled. Run `terminus-agent run` to start.\n'));
            return;
        }
        console.log();
    }

    // Check for Ollama availability
    console.log(chalk.gray('🔍 Checking for local LLM providers...\n'));
    const ollamaAvailable = await checkOllamaAvailable();
    let ollamaModels: string[] = [];

    if (ollamaAvailable) {
        ollamaModels = await listOllamaModels();
        console.log(chalk.green(`   ✅ Ollama detected`) + chalk.gray(` (${ollamaModels.length} models available)`));
    } else {
        console.log(chalk.gray('   ○ Ollama not detected'));
    }
    console.log();

    // =========================================================================
    // STEP 1: Agent Type Selection
    // =========================================================================
    printStep(0, 4, 'Select Your Agent');

    const { agentType } = await inquirer.prompt([{
        type: 'list',
        name: 'agentType',
        message: 'Which agent would you like to run?',
        choices: AGENT_CHOICES,
        pageSize: 15,
        loop: false,
    }]);

    const selectedAgent = AGENTS.find(a => a.id === agentType);
    console.log(chalk.green(`\n   ✓ Selected: ${AGENT_EMOJIS[agentType] || '🤖'} ${selectedAgent?.name}\n`));

    // =========================================================================
    // STEP 2: Wallet Configuration
    // =========================================================================
    printStep(1, 4, 'Wallet Configuration');

    console.log(chalk.gray('   Your wallet address will receive earnings from processed queries.\n'));

    const { wallet } = await inquirer.prompt([{
        type: 'input',
        name: 'wallet',
        message: '💳 Wallet address (0x...):',
        validate: (input: string) => {
            if (!input) return 'Wallet address is required';
            if (!input.startsWith('0x')) return chalk.red('Address must start with 0x');
            if (input.length !== 42) return chalk.red(`Invalid length (${input.length}/42 chars)`);
            if (!/^0x[a-fA-F0-9]{40}$/.test(input)) return chalk.red('Invalid characters in address');
            return true;
        },
        transformer: (input: string) => {
            if (!input) return '';
            if (input.startsWith('0x') && input.length === 42) {
                return chalk.green(input);
            }
            return chalk.yellow(input);
        },
    }]);

    console.log(chalk.green(`\n   ✓ Wallet: ${wallet.slice(0, 10)}...${wallet.slice(-8)}\n`));

    // Private key (optional)
    const { wantPrivateKey } = await inquirer.prompt([{
        type: 'confirm',
        name: 'wantPrivateKey',
        message: '🔐 Add private key for NFT verification? (optional)',
        default: false,
    }]);

    let privateKey: string | undefined;

    if (wantPrivateKey) {
        const { pk } = await inquirer.prompt([{
            type: 'password',
            name: 'pk',
            message: '🔑 Private key (0x...):',
            mask: '•',
            validate: (input: string) => {
                if (!input) return true; // Optional
                if (!input.startsWith('0x')) return chalk.red('Private key must start with 0x');
                if (input.length !== 66) return chalk.red(`Invalid length (${input.length}/66 chars)`);
                return true;
            },
        }]);
        privateKey = pk || undefined;
        if (privateKey) {
            printWarning('Private key stored locally. Use a dedicated wallet!');
        }
    }

    // =========================================================================
    // STEP 3: LLM Provider Configuration
    // =========================================================================
    printStep(2, 4, 'LLM Provider');

    console.log(chalk.gray('   Choose how your agent will process AI requests.\n'));

    const { llmProvider } = await inquirer.prompt([{
        type: 'list',
        name: 'llmProvider',
        message: '🧠 Select LLM provider:',
        choices: LLM_CHOICES,
        loop: false,
    }]);

    let apiKey = '';
    let llmBaseUrl = '';
    let llmModel = '';

    if (llmProvider === 'grok') {
        printSection('Grok API Configuration');
        console.log(chalk.gray('   Get your API key from: ') + chalk.cyan.underline('https://console.x.ai') + '\n');

        const { key } = await inquirer.prompt([{
            type: 'password',
            name: 'key',
            message: '🔑 Grok API key (xai-...):',
            mask: '•',
            validate: (input: string) => {
                if (!input) return 'API key is required';
                if (!input.startsWith('xai-')) return chalk.red('Grok API keys start with "xai-"');
                if (input.length < 20) return chalk.red('API key seems too short');
                return true;
            },
        }]);
        apiKey = key;
        console.log(chalk.green('\n   ✓ API key configured\n'));

    } else if (llmProvider === 'ollama') {
        printSection('Ollama Configuration');

        if (!ollamaAvailable) {
            console.log(chalk.yellow('   ⚠️  Ollama not detected. Make sure to install and run:\n'));
            console.log(chalk.gray('      brew install ollama   # macOS'));
            console.log(chalk.gray('      ollama serve'));
            console.log(chalk.gray('      ollama pull llama3\n'));
        }

        const ollamaAnswers = await inquirer.prompt([
            {
                type: 'input',
                name: 'baseUrl',
                message: '🌐 Ollama server URL:',
                default: 'http://localhost:11434',
            },
            {
                type: ollamaModels.length > 0 ? 'list' : 'input',
                name: 'model',
                message: ollamaModels.length > 0 ? '🦙 Select model:' : '🦙 Enter model name:',
                choices: ollamaModels.length > 0
                    ? ollamaModels.map(m => ({ name: `${m}`, value: m }))
                    : undefined,
                default: ollamaModels[0] || 'llama3',
            },
        ]);

        llmBaseUrl = ollamaAnswers.baseUrl;
        llmModel = ollamaAnswers.model;
        apiKey = 'local-llm';

        console.log(chalk.green(`\n   ✓ Ollama configured: ${llmModel} @ ${llmBaseUrl}\n`));

    } else if (llmProvider === 'openai-compatible') {
        printSection('OpenAI-Compatible Server');
        console.log(chalk.gray('   Works with: LM Studio, LocalAI, vLLM, text-generation-webui\n'));

        const openaiAnswers = await inquirer.prompt([
            {
                type: 'input',
                name: 'baseUrl',
                message: '🌐 Server URL:',
                default: 'http://localhost:1234',
            },
            {
                type: 'input',
                name: 'model',
                message: '🤖 Model name:',
                default: 'local-model',
            },
            {
                type: 'password',
                name: 'apiKey',
                message: '🔑 API key (press Enter if not required):',
                mask: '•',
            },
        ]);

        llmBaseUrl = openaiAnswers.baseUrl;
        llmModel = openaiAnswers.model;
        apiKey = openaiAnswers.apiKey || 'not-required';

        console.log(chalk.green(`\n   ✓ Server configured: ${llmModel} @ ${llmBaseUrl}\n`));
    }

    // =========================================================================
    // STEP 4: Network Configuration
    // =========================================================================
    printStep(3, 4, 'Network Configuration');

    console.log(chalk.gray('   Connect to the Terminus Control Plane to receive requests.\n'));

    const { controlPlaneUrl } = await inquirer.prompt([{
        type: 'input',
        name: 'controlPlaneUrl',
        message: '🌐 Control Plane URL:',
        default: 'ws://localhost:8081',
        validate: (input: string) => {
            if (!input.startsWith('ws://') && !input.startsWith('wss://')) {
                return chalk.red('URL must start with ws:// or wss://');
            }
            return true;
        },
    }]);

    // =========================================================================
    // Save Configuration
    // =========================================================================
    printDivider();

    const nodeId = generateNodeId(agentType, wallet);

    const config = {
        agentType,
        wallet,
        privateKey,
        apiKey,
        controlPlaneUrl,
        nodeId,
        llmProvider: llmProvider as 'grok' | 'ollama' | 'openai-compatible',
        llmBaseUrl: llmBaseUrl || undefined,
        llmModel: llmModel || undefined,
    };

    saveConfig(config);

    // =========================================================================
    // Success Summary
    // =========================================================================
    console.log(chalk.green.bold('\n╔════════════════════════════════════════════════════════════════╗'));
    console.log(chalk.green.bold('║                    ✅ SETUP COMPLETE!                          ║'));
    console.log(chalk.green.bold('╚════════════════════════════════════════════════════════════════╝\n'));

    console.log(chalk.cyan('📋 Configuration Summary:\n'));

    console.log(`   ${chalk.gray('Agent:')}          ${AGENT_EMOJIS[agentType] || '🤖'} ${selectedAgent?.name}`);
    console.log(`   ${chalk.gray('Node ID:')}        ${chalk.cyan(nodeId)}`);
    console.log(`   ${chalk.gray('Wallet:')}         ${wallet.slice(0, 10)}...${wallet.slice(-8)}`);
    console.log(`   ${chalk.gray('LLM Provider:')}   ${llmProvider === 'grok' ? '🌐 Grok API' : llmProvider === 'ollama' ? '🦙 Ollama' : '🔧 OpenAI-Compatible'}`);
    if (llmModel) {
        console.log(`   ${chalk.gray('Model:')}          ${llmModel}`);
    }
    console.log(`   ${chalk.gray('Control Plane:')} ${controlPlaneUrl}`);
    console.log(`   ${chalk.gray('Config File:')}    ${getConfigPath()}`);

    console.log(chalk.cyan('\n' + '─'.repeat(60)));

    console.log(chalk.white.bold('\n🚀 Ready to start! Run:\n'));
    console.log(chalk.cyan('   npx terminus-agent run\n'));

    console.log(chalk.gray('Other commands:'));
    console.log(chalk.gray('   npx terminus-agent status  - Check configuration'));
    console.log(chalk.gray('   npx terminus-agent init    - Reconfigure agent\n'));
}
