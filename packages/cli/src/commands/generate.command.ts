import { CommanderStatic } from 'commander';
import { generateFilesAction } from '../actions';

export function generateCommand(program: CommanderStatic) {
    program
        .command('generate <sourcePath>')
        .alias('g')
        .option('-d, --dry-run', 'Report actions that would be taken without writing out results.', false)
        .option('-p, --project [project]', 'Project in which to generate files.')
        .option('-c, --collection [collectionName]', 'Schematics collection to use.')
        .helpOption('-h, --help', 'Output usage information.')
        .action(generateFilesAction);
}
