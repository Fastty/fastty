import ts from 'typescript';

import { flatten } from '../utils';
import { Document, Constructors } from '../interfaces/document.interface';

export function angularExporter<T extends ts.Node>(doc: Document): ts.NodeArray<T> {
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
