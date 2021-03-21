import ts from 'typescript';
import { join } from 'path';

import { nestjsParser } from './parsers';

export function parseSource(sourceFile: ts.SourceFile, checker: ts.TypeChecker) {
    return nestjsParser(sourceFile, checker);
}

const fileNames = [join(__dirname, '/resource/cat.controller.ts')];
const compilerOptions: ts.CompilerOptions = {
    ...ts.getDefaultCompilerOptions(),
    allowJs: true,
    target: ts.ScriptTarget.ES5,
};
const program = ts.createProgram(fileNames, compilerOptions);
const importedSourceFiles: ts.SourceFile[] = [];
const isRootSourceFile = (fileName: string) => fileNames.some((rootPath) => rootPath === fileName);
for (const sourceFile of program.getSourceFiles()) {
    if (!sourceFile.isDeclarationFile && !isRootSourceFile(sourceFile.fileName)) {
        importedSourceFiles.push(sourceFile);
    }

    if (!sourceFile.isDeclarationFile && isRootSourceFile(sourceFile.fileName)) {
        parseSource(sourceFile, program.getTypeChecker());
    }
}
