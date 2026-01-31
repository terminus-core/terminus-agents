// =============================================================================
// TERMINUS AGENT - Run Command (Enhanced UX)
// =============================================================================

import chalk from 'chalk';
import { loadConfig, configExists } from '../config/store.js';
import { AgentClient } from '../network/client.js';

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

function printStartupBanner(config: ReturnType<typeof loadConfig>): void {
    if (!config) return;

    const emoji = AGENT_EMOJIS[config.agentType] || '🤖';
    const provider = config.llmProvider || 'grok';
    const providerIcon = provider === 'grok' ? '🌐' : provider === 'ollama' ? '🦙' : '🔧';

    console.log();
    console.log(chalk.cyan.bold('╔════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan.bold('║              🚀 TERMINUS AGENT STARTING                    ║'));
    console.log(chalk.cyan.bold('╚════════════════════════════════════════════════════════════╝'));
    console.log();

    console.log(`   ${chalk.gray('Agent:')}          ${emoji}  ${chalk.white.bold(config.agentType)}`);
    console.log(`   ${chalk.gray('Node ID:')}        ${chalk.cyan(config.nodeId)}`);
    console.log(`   ${chalk.gray('Wallet:')}         ${config.wallet.slice(0, 10)}...${config.wallet.slice(-8)}`);
    console.log(`   ${chalk.gray('LLM Provider:')}   ${providerIcon}  ${provider}${config.llmModel ? ` (${config.llmModel})` : ''}`);
    console.log(`   ${chalk.gray('Control Plane:')} ${config.controlPlaneUrl}`);

    console.log(chalk.gray('\n────────────────────────────────────────────────────────────\n'));

    console.log(chalk.yellow('   ⏳ Connecting to Control Plane...\n'));
}

export async function runCommand(): Promise<void> {
    if (!configExists()) {
        console.log();
        console.log(chalk.red.bold('╔════════════════════════════════════════╗'));
        console.log(chalk.red.bold('║         ❌ NOT CONFIGURED              ║'));
        console.log(chalk.red.bold('╚════════════════════════════════════════╝'));
        console.log();
        console.log(chalk.gray('   No configuration found. Run setup first:\n'));
        console.log(chalk.cyan('   npx terminus-agent init\n'));
        process.exit(1);
    }

    const config = loadConfig();
    if (!config) {
        console.log(chalk.red('\n   ❌ Failed to load configuration.\n'));
        console.log(chalk.gray('   Try reconfiguring:'));
        console.log(chalk.cyan('   npx terminus-agent init\n'));
        process.exit(1);
    }

    printStartupBanner(config);

    const client = new AgentClient(config);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log(chalk.yellow('\n\n   🛑 Shutting down gracefully...\n'));
        client.disconnect();
        console.log(chalk.gray('   Agent disconnected. Goodbye! 👋\n'));
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        console.log(chalk.yellow('\n\n   🛑 Received SIGTERM...\n'));
        client.disconnect();
        process.exit(0);
    });

    try {
        await client.connect();
    } catch (error) {
        console.log(chalk.red(`\n   ❌ Connection failed: ${(error as Error).message}\n`));
        console.log(chalk.gray('   Check if Control Plane is running:'));
        console.log(chalk.gray(`   ${config.controlPlaneUrl}\n`));
        process.exit(1);
    }
}
