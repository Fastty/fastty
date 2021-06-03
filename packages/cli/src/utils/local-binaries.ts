import { CommanderStatic } from 'commander';
import { existsSync } from 'fs';
import { join, posix, resolve } from 'path';

const localBinPathSegments = [process.cwd(), resolve('src', 'commands')];

export function statLocalBinaries(): boolean {
    return existsSync(join(...localBinPathSegments));
}

export function loadLocalBinaries() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const commandsFile = require(posix.join(...localBinPathSegments, 'commands'));
    return commandsFile.load as (program: CommanderStatic) => void;
}
