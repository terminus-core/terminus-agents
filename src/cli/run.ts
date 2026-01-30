// =============================================================================
// TERMINUS AGENT - Run Command
// =============================================================================

import chalk from 'chalk';
import { loadConfig, configExists } from '../config/store.js';
import { AgentClient } from '../network/client.js';

export async function runCommand(): Promise<void> {
    if (!configExists()) {
        console.log(chalk.red('\n❌ No configuration found.'));
        console.log(chalk.gray('   Run `terminus-agent init` first.\n'));
        process.exit(1);
    }

    const config = loadConfig();
    if (!config) {
        console.log(chalk.red('\n❌ Failed to load configuration.\n'));
        process.exit(1);
    }

    console.log(chalk.cyan('\n🚀 Starting Terminus Agent\n'));
    console.log(chalk.gray(`   Agent: ${config.agentType}`));
    console.log(chalk.gray(`   Node ID: ${config.nodeId}`));
    console.log(chalk.gray(`   Wallet: ${config.wallet.slice(0, 10)}...`));
    console.log(chalk.gray(`   Control Plane: ${config.controlPlaneUrl}\n`));

    const client = new AgentClient(config);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log(chalk.yellow('\n🛑 Shutting down...'));
        client.disconnect();
        process.exit(0);
    });

    await client.connect();
}
