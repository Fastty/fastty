import ts from 'typescript';

export function report(sourceFile: ts.SourceFile, message: string, node?: ts.Node) {
    const startAt = node ? node.getStart() : sourceFile.getStart();
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(startAt);
    console.error(`${sourceFile?.fileName} (${line + 1},${character + 1}): ${message}`);
}
