import { resolve } from 'path';
import { statSync } from 'fs';

import { parseSource } from '@fastty/core';
import { watch as watchFiles } from 'chokidar';
import { OptionValues } from 'commander';
import {
    SourceFile,
    ScriptTarget,
    CompilerOptions,
    TypeChecker,
    getDefaultCompilerOptions,
    createProgram,
} from 'typescript';

import { loadSchematicsBinary } from '../utils';
import { CliRunner, runSchematic } from '../runners';
import { FASTTY_SCHEMATICS_PATH } from '../constants/fastty-schematics-path';

interface Options extends OptionValues {
    dryRun: boolean;
    watch: boolean;
    path: string | null;
    collection: string;
}

function getProgramFromRootFiles(files: Array<string>) {
    const compilerOptions: CompilerOptions = {
        ...getDefaultCompilerOptions(),
        allowJs: true,
        target: ScriptTarget.ES5,
        experimentalDecorators: true,
    };
    return createProgram(files, compilerOptions);
}

function executeFileGeneration(sourceFile: SourceFile, binary: string, typeChecker: TypeChecker, options: Options) {
    const { dryRun, collection, watch } = options;
    const document = parseSource(sourceFile, typeChecker);

    new CliRunner()
        .runner(runSchematic)
        .binary(binary)
        .command(`${FASTTY_SCHEMATICS_PATH}:${collection ?? 'angular'}`)
        .args(`--document='${JSON.stringify(document)}'`, `--dry-run=${dryRun}`)
        .exec();

    if (watch && !dryRun) {
        const watcher = watchFiles(sourceFile.fileName);
        watcher.on('change', (path) => generateFilesAction(path, { ...options, watch: false }));
    }
}

export function generateFilesAction(sourcePath: string, options: Options) {
    const schematicBin = loadSchematicsBinary();
    const solvedPath = resolve(sourcePath);
    const stat = statSync(solvedPath);

    if (!stat.isDirectory()) {
        const importedSourceFiles: SourceFile[] = [];
        const program = getProgramFromRootFiles([solvedPath]);
        const isRootSourceFile = (fileName: string) =>
            program.getRootFileNames().some((rootFileName) => rootFileName === fileName);

        program.getSourceFiles().forEach((sourceFile) => {
            if (isRootSourceFile(sourceFile.fileName)) {
                executeFileGeneration(sourceFile, schematicBin, program.getTypeChecker(), options);
            }

            if (!sourceFile.isDeclarationFile && !isRootSourceFile(sourceFile.fileName)) {
                importedSourceFiles.push(sourceFile);
            }
        });
    }
}
