import ts from 'typescript';

import { Nullable, report } from '../utils';
import { Document, Constructors } from '../interfaces/document.interface';
import { Tokens } from '../constants/tokens';

let sourceFile: ts.SourceFile | null = null;
export function nestjsParser(node: ts.Node, checker: ts.TypeChecker): Nullable<Document> {
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
            decorators: symbol.valueDeclaration?.decorators?.map(serializeDecorator) ?? [],
        };
    }

    /** Serialize a expression into a Symbol */
    function serializeExpression(expression: ts.Expression): Document {
        return {
            name: expression.getText().replace(/'/g, ''),
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

        const returnTypeFromSignature = checker.getReturnTypeOfSignature(signature);
        let returnType = checker.typeToString(returnTypeFromSignature);
        if (returnTypeFromSignature?.symbol?.name === Tokens.Promise) {
            // retrive the type inside typeArguments of Promise. Ex: Promise<T>, this returns T
            returnType = checker.typeToString(
                (returnTypeFromSignature as ts.TypeReference).typeArguments?.[0] as ts.Type,
            );
        }

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
        return ts.forEachChild(node, (node) => nestjsParser(node, checker));
    }

    return parsedSource;
}
