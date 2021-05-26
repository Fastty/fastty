import { resolve } from 'path';
import { statSync } from 'fs';

import { OptionValues } from 'commander';
import { parseSource } from '@fastty/core';
import {
    Program,
    SourceFile,
    ScriptTarget,
    CompilerOptions,
    getDefaultCompilerOptions,
    createProgram,
} from 'typescript';

import { loadSchematicsBinary } from '../utils';
import { CliRunner, runSchematic } from '../runners';
import { FASTTY_SCHEMATICS_PATH } from '../constants/fastty-schematics-path';

interface Options extends OptionValues {
    dryRun: boolean;
    path: string | null;
    collection: string;
}

export function generateFilesAction(sourcePath: string, options: Options) {
    const schematicBin = loadSchematicsBinary();
    const solvedPath = resolve(sourcePath);
    const stat = statSync(solvedPath);

    if (!stat.isDirectory()) {
        const fileNames = [solvedPath];
        const importedSourceFiles: SourceFile[] = [];
        const program = getProgramFromRootFiles(fileNames);
        const isRootSourceFile = (fileName: string) => fileNames.some((rootPath) => rootPath === fileName);

        program.getSourceFiles().forEach((sourceFile) => {
            if (isRootSourceFile(sourceFile.fileName)) {
                const document = parseSource(sourceFile, program.getTypeChecker());
                new CliRunner()
                    .runner(runSchematic)
                    .binary(schematicBin)
                    .command(`${FASTTY_SCHEMATICS_PATH}:${options.collection ?? 'angular'}`)
                    .args(`--document='${JSON.stringify(document)}'`, `--dry-run=${options.dryRun}`)
                    .exec();
            }

            if (!sourceFile.isDeclarationFile && !isRootSourceFile(sourceFile.fileName)) {
                importedSourceFiles.push(sourceFile);
            }
        });
    }
}

function getProgramFromRootFiles(files: Array<string>): Program {
    const compilerOptions: CompilerOptions = {
        ...getDefaultCompilerOptions(),
        allowJs: true,
        target: ScriptTarget.ES5,
    };
    return createProgram(files, compilerOptions);
}
