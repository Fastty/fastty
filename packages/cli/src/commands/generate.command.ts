import { CommanderStatic } from 'commander';

export function generateCommand(program: CommanderStatic) {
    program
        .command('generate <schematic> [sourcePath]')
        .alias('g')
        .option('-d, --dry-run', 'Report actions that would be taken without writing out results.')
        .option('-p, --project [project]', 'Project in which to generate files.')
        .option('-c, --collection [collectionName]', 'Schematics collection to use.')
        .helpOption('-h, --help', 'Output usage information.')
        .action(async (schematic: string, sourcePath: string | null) => {
            console.info(`generate command with ${schematic} and ${sourcePath ?? ''}!`);
        });
}
