#!/usr/bin/env node
import commander from 'commander';
import { cyan } from 'chalk';
import { textSync } from 'figlet';

import { version as pkgJsonVersion } from '../package.json';
import { statLocalBinaries, loadLocalBinaries } from '../src/utils';
import { load as commandLoader } from '../src/commands';

function bootstrap(): void {
    const program = commander;

    program
        .version(
            process.env.npm_package_version ?? pkgJsonVersion,
            '-v, --version',
            'Output @fastty/cli current version.',
        )
        .usage('<command> [options]')
        .helpOption('-h, --help', 'Output usage information.')
        .description(fasttyDescription());

    if (statLocalBinaries()) {
        const localCommandLoader = loadLocalBinaries();
        localCommandLoader(program);
    } else {
        commandLoader(program);
    }

    program.parse(process.argv);
}

function fasttyDescription(): string {
    return `
        ${cyan(textSync('@fastty-cli', { horizontalLayout: 'full' }))}
        \n\nA tool that will help you to easy integrate your server and client application.
    `;
}

bootstrap();
