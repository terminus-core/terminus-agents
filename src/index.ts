// =============================================================================
// TERMINUS AGENT - CLI Entry Point
// =============================================================================

import { program } from 'commander';
import { initCommand } from './cli/init.js';
import { runCommand } from './cli/run.js';
import { statusCommand } from './cli/status.js';

program
    .name('terminus-agent')
    .description('Standalone agent runner for Terminus network')
    .version('0.1.0');

program
    .command('init')
    .description('Initialize agent configuration')
    .action(initCommand);

program
    .command('run')
    .description('Start the agent and connect to Control Plane')
    .action(runCommand);

program
    .command('status')
    .description('Check agent status')
    .action(statusCommand);

program.parse();
