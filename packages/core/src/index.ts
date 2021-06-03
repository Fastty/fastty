import ts from 'typescript';

import { nestjsParser } from './parsers';

export function parseSource(sourceFile: ts.SourceFile, checker: ts.TypeChecker) {
    return nestjsParser(sourceFile, checker);
}
