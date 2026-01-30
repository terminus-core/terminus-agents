// =============================================================================
// TERMINUS AGENT - Status Command
// =============================================================================

import chalk from 'chalk';
import { loadConfig, configExists, getConfigPath } from '../config/store.js';

export async function statusCommand(): Promise<void> {
    if (!configExists()) {
        console.log(chalk.red('\n❌ No configuration found.'));
        console.log(chalk.gray('   Run `terminus-agent init` first.\n'));
        return;
    }

    const config = loadConfig();
    if (!config) {
        console.log(chalk.red('\n❌ Failed to load configuration.\n'));
        return;
    }

    console.log(chalk.cyan('\n📊 Terminus Agent Status\n'));
    console.log(`   ${chalk.gray('Config:')} ${getConfigPath()}`);
    console.log(`   ${chalk.gray('Agent:')} ${config.agentType}`);
    console.log(`   ${chalk.gray('Node ID:')} ${config.nodeId}`);
    console.log(`   ${chalk.gray('Wallet:')} ${config.wallet}`);
    console.log(`   ${chalk.gray('Control Plane:')} ${config.controlPlaneUrl}`);
    console.log(`   ${chalk.gray('API Key:')} ${config.apiKey.slice(0, 10)}...`);
    console.log();
}
