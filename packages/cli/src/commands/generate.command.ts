import { CommanderStatic } from 'commander';
import { generateFilesAction } from '../actions';

export function generateCommand(program: CommanderStatic) {
    program
        .command('generate <sourcePath>')
        .alias('g')
        .option('-d, --dry-run', 'Report actions that would be taken without writing out results.', false)
        .option('-p, --path [path]', 'Path that should save exported files')
        .helpOption('-h, --help', 'Output usage information.')
        .action(generateFilesAction);
}
