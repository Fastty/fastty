import { spawn } from 'child_process';

import { red } from 'chalk';

export function runSchematic(binary: string, ...args: string[]) {
    const childProcess = spawn(binary, args, {
        cwd: process.cwd(),
        shell: true,
    }).on('error', (err) => {
        console.error(`An ${red('Error').bold()} occured spawing sub process!\n${err}`);
    });

    childProcess.stdout.on('data', (data) => {
        console.info(data.toString().replace(/\r\n|\n/, ''));
    });

    childProcess.stderr.on('data', (err) => {
        console.error(err.toString('utf-8'));
        process.exit(1);
    });
}
