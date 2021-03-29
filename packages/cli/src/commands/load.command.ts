import { CommanderStatic } from 'commander';
import { red as chalkRed } from 'chalk';
import { generateCommand } from './generate.command';

export function load(program: CommanderStatic) {
    generateCommand(program);

    handleInvalidCommand(program);
}

function handleInvalidCommand(program: CommanderStatic) {
    program.on('command:*', () => {
        console.error(`\n${chalkRed('Error').bold()} Invalid command: ${chalkRed('%s')}`, program.args.join('; '));
        console.warn(`See ${chalkRed('--help')} for a list of available commands.\n`);
        process.exit(1);
    });
}
