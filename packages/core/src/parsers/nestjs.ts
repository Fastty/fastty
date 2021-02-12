import ts from 'typescript';

import { Document, Constructors } from '../interfaces/document.interface';

export function nestjsParser(node: ts.Node, checker: ts.TypeChecker) {
    let sourceFile: ts.SourceFile | null = null;
    if (!sourceFile) {
        sourceFile = node as ts.SourceFile;
    }
    let parsedSource: Document | null = null;

    function serializeClass(node: ts.ClassDeclaration) {
        const { symbol } = checker.getTypeAtLocation(node);
        const details = serializeSymbol(symbol);
        details.decorators = node.decorators?.map(serializeDecorator);
        details.members = node.members
            .filter((member) => member.kind === ts.SyntaxKind.MethodDeclaration)
            .map(serializeMethodDeclaration);
        return details;
    }

    function serializeDecorator(decorator: ts.Decorator) {
        const symbol = checker.getSymbolAtLocation(decorator.expression.getFirstToken() as ts.Node) as ts.Symbol;
        const decoratorType = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
        const details = serializeSymbol(symbol);
        details.arguments = (decorator.expression as ts.NewExpression).arguments?.map(serializeExpression);
        details.constructors = decoratorType.getCallSignatures().map(serializeSignature);
        return details;
    }

    /** Serialize a symbol into a json object */
    function serializeSymbol(symbol: ts.Symbol): Document {
        return {
            name: symbol.getName(),
            type: checker.typeToString(checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration)),
        };
    }

    /** Serialize a expression into a Symbol */
    function serializeExpression(expression: ts.Expression): Document {
        return {
            name: expression.getText(),
            type: checker.typeToString(checker.getTypeAtLocation(expression)),
        };
    }

    /** Serialize a signature (call or construct) */
    function serializeSignature(signature: ts.Signature): Constructors {
        return {
            parameters: signature.parameters.map(serializeSymbol),
        };
    }

    function serializeMethodDeclaration(methodDeclaration: ts.MethodDeclaration | ts.ClassElement) {
        const { symbol } = checker.getTypeAtLocation(methodDeclaration);
        const details = serializeSymbol(symbol);

        const signature = checker.getSignatureFromDeclaration(
            methodDeclaration as ts.SignatureDeclaration,
        ) as ts.Signature;
        const returnType = checker.typeToString(checker.getReturnTypeOfSignature(signature));

        return {
            ...details,
            returnType,
            constructors: symbol
                .getDeclarations()
                ?.map((declaration) =>
                    serializeSignature(
                        checker.getSignatureFromDeclaration(declaration as ts.SignatureDeclaration) as ts.Signature,
                    ),
                ),
            decorators: methodDeclaration.decorators?.map(serializeDecorator),
        };
    }

    if (ts.isClassDeclaration(node) && node.decorators) {
        parsedSource = serializeClass(node);

        if (!parsedSource) {
            report(sourceFile, 'The source file should contain a class definition with a @Controller decorated!');
        }

        parsedSource.fileName = sourceFile.fileName;
    }

    if (!parsedSource) {
        ts.forEachChild(node, (node) => nestjsParser(node, checker));
    }

    function report(node: ts.Node, message: string) {
        const { line, character } = sourceFile?.getLineAndCharacterOfPosition(node.getStart()) as ts.LineAndCharacter;
        console.error(`${sourceFile?.fileName} (${line + 1},${character + 1}): ${message}`);
    }

    return parsedSource;
}
