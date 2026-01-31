// =============================================================================
// TERMINUS AGENT - Status Command (Enhanced UX)
// =============================================================================

import chalk from 'chalk';
import { loadConfig, configExists, getConfigPath } from '../config/store.js';
import { checkOllamaAvailable } from '../llm/provider.js';

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

export async function statusCommand(): Promise<void> {
    console.log();
    console.log(chalk.cyan.bold('╔════════════════════════════════════════╗'));
    console.log(chalk.cyan.bold('║       📊 TERMINUS AGENT STATUS         ║'));
    console.log(chalk.cyan.bold('╚════════════════════════════════════════╝'));
    console.log();

    if (!configExists()) {
        console.log(chalk.red('   ❌ No configuration found.\n'));
        console.log(chalk.gray('   Run this command to set up:'));
        console.log(chalk.cyan('   npx terminus-agent init\n'));
        return;
    }

    const config = loadConfig();
    if (!config) {
        console.log(chalk.red('   ❌ Failed to load configuration.\n'));
        console.log(chalk.gray('   Try reconfiguring:'));
        console.log(chalk.cyan('   npx terminus-agent init\n'));
        return;
    }

    // Agent Info
    console.log(chalk.yellow('┌─ Agent Configuration ─────────────────┐\n'));

    const emoji = AGENT_EMOJIS[config.agentType] || '🤖';
    console.log(`   ${chalk.gray('Agent Type:')}     ${emoji}  ${chalk.white.bold(config.agentType)}`);
    console.log(`   ${chalk.gray('Node ID:')}        ${chalk.cyan(config.nodeId)}`);
    console.log(`   ${chalk.gray('Config File:')}    ${chalk.gray(getConfigPath())}`);

    // Wallet Info
    console.log(chalk.yellow('\n┌─ Wallet ───────────────────────────────┐\n'));

    const walletShort = `${config.wallet.slice(0, 10)}...${config.wallet.slice(-8)}`;
    console.log(`   ${chalk.gray('Address:')}        ${chalk.green(walletShort)}`);
    console.log(`   ${chalk.gray('Private Key:')}    ${config.privateKey ? chalk.green('✓ Configured') : chalk.gray('○ Not set')}`);

    // LLM Provider Info
    console.log(chalk.yellow('\n┌─ LLM Provider ─────────────────────────┐\n'));

    const provider = config.llmProvider || 'grok';
    const providerIcon = provider === 'grok' ? '🌐' : provider === 'ollama' ? '🦙' : '🔧';
    const providerName = provider === 'grok' ? 'Grok API (xAI Cloud)'
        : provider === 'ollama' ? 'Ollama (Local)'
            : 'OpenAI-Compatible';

    console.log(`   ${chalk.gray('Provider:')}       ${providerIcon}  ${chalk.white(providerName)}`);

    if (config.llmModel) {
        console.log(`   ${chalk.gray('Model:')}          ${chalk.white(config.llmModel)}`);
    }
    if (config.llmBaseUrl) {
        console.log(`   ${chalk.gray('Base URL:')}       ${chalk.gray(config.llmBaseUrl)}`);
    }

    // Provider Status Check
    if (provider === 'ollama') {
        const ollamaOk = await checkOllamaAvailable(config.llmBaseUrl);
        console.log(`   ${chalk.gray('Status:')}         ${ollamaOk ? chalk.green('✓ Connected') : chalk.red('✗ Not reachable')}`);
    } else if (provider === 'grok') {
        const keyPreview = config.apiKey.slice(0, 8) + '...';
        console.log(`   ${chalk.gray('API Key:')}        ${chalk.gray(keyPreview)}`);
    }

    // Network Info
    console.log(chalk.yellow('\n┌─ Network ──────────────────────────────┐\n'));

    console.log(`   ${chalk.gray('Control Plane:')} ${chalk.cyan(config.controlPlaneUrl)}`);

    // Test connection hint
    const isLocal = config.controlPlaneUrl.includes('localhost');
    if (isLocal) {
        console.log(`   ${chalk.gray('Mode:')}           ${chalk.yellow('⚡ Local Development')}`);
    } else {
        console.log(`   ${chalk.gray('Mode:')}           ${chalk.green('🌍 Production')}`);
    }

    // Footer
    console.log(chalk.gray('\n─────────────────────────────────────────\n'));

    console.log(chalk.white.bold('📋 Quick Commands:\n'));
    console.log(`   ${chalk.cyan('npx terminus-agent run')}    ${chalk.gray('Start the agent')}`);
    console.log(`   ${chalk.cyan('npx terminus-agent init')}   ${chalk.gray('Reconfigure')}`);
    console.log();
}
