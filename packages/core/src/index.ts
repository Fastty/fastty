import ts from 'typescript';
import { join } from 'path';
import { writeFileSync } from 'fs';

import { nestjsParser } from './parsers';
import { angularExporter } from './exporters';
import { Document } from './interfaces/document.interface';

export function parseSource(sourceFile: ts.SourceFile, checker: ts.TypeChecker) {
    return nestjsParser(sourceFile, checker);
}

export function exportSource(doc: Document) {
    const resultFile = ts.createSourceFile(
        'someFileName.ts',
        '',
        ts.ScriptTarget.Latest,
        /*setParentNodes*/ false,
        ts.ScriptKind.TS,
    );
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const result = printer.printList(ts.ListFormat.MultiLine, angularExporter(doc), resultFile);

    writeFileSync(resultFile.fileName, result, 'utf8');
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
        const document = parseSource(sourceFile, program.getTypeChecker());
        if (document) {
            exportSource(document);
        }
    }
}
