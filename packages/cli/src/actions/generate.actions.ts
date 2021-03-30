import { resolve } from 'path';
import { statSync } from 'fs';
import { OptionValues } from 'commander';

import { CompilerOptions, getDefaultCompilerOptions, ScriptTarget, createProgram, SourceFile } from 'typescript';
import { parseSource } from '@fastty/core';

import { loadSchematicsBinary } from '../utils';
import { runSchematic } from '../runners/schematics.runner';

interface Options extends OptionValues {
    dryRun: boolean;
    project: string | null;
    collection: string | null;
}

export function generateFilesAction(sourcePath: string, options: Options) {
    const schematicBin = loadSchematicsBinary();
    const stat = statSync(sourcePath);

    if (!stat.isDirectory()) {
        const fileNames = [resolve(sourcePath)];
        const compilerOptions: CompilerOptions = {
            ...getDefaultCompilerOptions(),
            allowJs: true,
            target: ScriptTarget.ES5,
        };
        const program = createProgram(fileNames, compilerOptions);
        const importedSourceFiles: SourceFile[] = [];
        const isRootSourceFile = (fileName: string) => fileNames.some((rootPath) => rootPath === fileName);
        for (const sourceFile of program.getSourceFiles()) {
            if (!sourceFile.isDeclarationFile && !isRootSourceFile(sourceFile.fileName)) {
                importedSourceFiles.push(sourceFile);
            }

            if (!sourceFile.isDeclarationFile && isRootSourceFile(sourceFile.fileName)) {
                const document = parseSource(sourceFile, program.getTypeChecker());
                runSchematic(
                    schematicBin,
                    ...[
                        `@fastty/schematics:${options.collection ?? 'angular'}`,
                        `--document=${Buffer.from(JSON.stringify(document)).toString('base64')}`,
                    ],
                );
            }
        }
    }
}
