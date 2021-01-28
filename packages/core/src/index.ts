import ts from 'typescript';
import { writeFileSync } from 'fs';
import { join } from 'path';

import { Nullable, flatten } from './utils';

interface Constructors {
    parameters?: Document[];
}

interface Document {
    name: string;
    type: string;
    fileName?: string;
    returnType?: string;
    arguments?: Nullable<Document>[];
    constructors?: Nullable<Constructors>[];
    members?: Nullable<Document>[];
    decorators?: Nullable<Document>[];
}

export function parseSource(sourceFile: ts.SourceFile, checker: ts.TypeChecker): Document | null {
    let parsedSource: Document | null = null;
    nestjsParser(sourceFile);

    return parsedSource;

    function nestjsParser(node: ts.Node) {
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
            ts.forEachChild(node, nestjsParser);
        }
    }

    function report(node: ts.Node, message: string) {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        console.error(`${sourceFile.fileName} (${line + 1},${character + 1}): ${message}`);
    }
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
    const result = printer.printList(ts.ListFormat.MultiLine, angularExporter(), resultFile);

    writeFileSync(resultFile.fileName, result, 'utf8');

    function angularExporter<T extends ts.Node>(): ts.NodeArray<T> {
        const factory = ts.factory;

        function createNamedImports(moduleSpecifierName: string, ...names: string[]): ts.ImportDeclaration {
            return factory.createImportDeclaration(
                undefined,
                undefined,
                factory.createImportClause(
                    false,
                    undefined,
                    factory.createNamedImports(
                        names.map((name) => factory.createImportSpecifier(undefined, factory.createIdentifier(name))),
                    ),
                ),
                factory.createStringLiteral(moduleSpecifierName, true),
            );
        }

        let baseUrl: string;
        if (doc.decorators) {
            const controllerDecorator = doc.decorators.find((dec) => dec?.name === 'Controller');

            if (controllerDecorator?.arguments) {
                const [endpoint] = controllerDecorator.arguments;
                baseUrl = endpoint?.name.replace(/'/g, '') || '';
            }
        }

        let members: Array<ts.MethodDeclaration> = [];
        if (doc.members) {
            members = doc.members.map<ts.MethodDeclaration>((member) => {
                const [decorator] = member?.decorators || [];
                let endpoint = `/${baseUrl}`;
                if (decorator?.arguments && decorator.arguments.length) {
                    const [resourceEndpoint] = decorator.arguments;
                    endpoint += `/${resourceEndpoint?.name.replace(/'/g, '')}`;
                }
                let parameters: Array<ts.ParameterDeclaration> = [];
                if (member?.constructors) {
                    parameters = flatten(
                        (member.constructors as Constructors[]).map(({ parameters }) => parameters || []),
                    ).map((p) => {
                        const name = p.name || '';
                        return factory.createParameterDeclaration(
                            undefined,
                            undefined,
                            undefined,
                            factory.createIdentifier(name),
                            undefined,
                            factory.createTypeReferenceNode(factory.createIdentifier(p.type), undefined),
                        );
                    });
                }

                return factory.createMethodDeclaration(
                    undefined,
                    undefined,
                    undefined,
                    factory.createIdentifier(`${member?.name}`),
                    undefined,
                    undefined,
                    parameters,
                    factory.createTypeReferenceNode(factory.createIdentifier('Observable'), [
                        factory.createTypeReferenceNode(factory.createIdentifier(`${member?.returnType}`), undefined),
                    ]),
                    factory.createBlock(
                        [
                            factory.createReturnStatement(
                                factory.createCallExpression(
                                    factory.createPropertyAccessExpression(
                                        factory.createPropertyAccessExpression(
                                            factory.createThis(),
                                            factory.createIdentifier('http'),
                                        ),
                                        factory.createIdentifier((decorator as Document).name.toLowerCase()),
                                    ),
                                    [
                                        factory.createTypeReferenceNode(
                                            factory.createIdentifier(`${member?.returnType}`),
                                            undefined,
                                        ),
                                    ],
                                    [factory.createStringLiteral(endpoint, true), factory.createIdentifier('body')],
                                ),
                            ),
                        ],
                        true,
                    ),
                );
            });
        }

        const output: ts.NodeArray<ts.Node> = factory.createNodeArray([
            createNamedImports('@angular/core', 'Injectable'),
            createNamedImports('@angular/common/http', 'HttpClient'),

            factory.createClassDeclaration(
                [
                    factory.createDecorator(
                        factory.createCallExpression(factory.createIdentifier('Injectable'), undefined, undefined),
                    ),
                ],
                [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
                factory.createIdentifier(`${doc.name}Service`),
                undefined,
                undefined,
                [
                    factory.createConstructorDeclaration(
                        undefined,
                        undefined,
                        [
                            factory.createParameterDeclaration(
                                undefined,
                                [factory.createModifier(ts.SyntaxKind.PrivateKeyword)],
                                undefined,
                                factory.createIdentifier('http'),
                                undefined,
                                factory.createTypeReferenceNode(factory.createIdentifier('HttpClient'), undefined),
                                undefined,
                            ),
                        ],
                        factory.createBlock([], false),
                    ),
                    ...members,
                ],
            ),
        ]);

        return output as ts.NodeArray<T>;
    }
}

const fileNames = [join(__dirname, '/resource/cat.controller.ts')];
const compilerOptions: ts.CompilerOptions = {
    ...ts.getDefaultCompilerOptions(),
    allowJs: true,
    target: ts.ScriptTarget.ES5,
};
const program = ts.createProgram(fileNames, compilerOptions);
for (const sourceFile of program.getSourceFiles()) {
    // parse source file
    if (!sourceFile.isDeclarationFile) {
        const document = parseSource(sourceFile, program.getTypeChecker());
        if (document) {
            exportSource(document);
        }
    }
}
