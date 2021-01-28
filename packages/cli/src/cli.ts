/* eslint-disable no-console */
import { cyan } from 'chalk';
import { textSync } from 'figlet';
import yargs from 'yargs';

function main() {
    console.clear();

    console.log(cyan(textSync('fastty-cli', { horizontalLayout: 'full' })));

    console.log(
        '\n\nWelcome to Fastty-CLI, this will help you to easy integrate your server and client application.\n\n',
    );

    const args = yargs.options({
        source: {
            alias: 's',
            string: true,
            demandOption: true,
            description: 'Path that fastty loops recursively searching for pattern',
        },
        dest: {
            alias: 'd',
            string: true,
            demandOption: true,
            description: 'Path that fastty will export code integration',
        },
    }).argv;

    console.log(args);
}

main();
