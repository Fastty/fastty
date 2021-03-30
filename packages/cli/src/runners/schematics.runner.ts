import { spawn } from 'child_process';

import { red } from 'chalk';

export function runSchematic(binary: string, ...args: string[]) {
    const childProcess = spawn(binary, args, {
        cwd: process.cwd(),
        shell: true,
    });

    childProcess.stdout.on('data', (data) => console.info(data.toString().replace(/\r\n|\n/, '')));

    childProcess.on('error', (err) => {
        console.error(`An ${red('Error').bold()} occured while generating file!\n${err}`);
    });
}
