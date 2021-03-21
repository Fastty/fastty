import { normalize, strings } from '@angular-devkit/core';
import {
    apply,
    applyTemplates,
    chain,
    mergeWith,
    move,
    Rule,
    SchematicContext,
    Tree,
    url,
} from '@angular-devkit/schematics';
import { Document } from '../../interfaces/document.interface';

import { AngularServiceSchema } from './schema';
import { document } from './resource/document-resource';

// You don't have to export the function as default. You can also have more than one rule factory
// per file.
export function schematics(_options: AngularServiceSchema): Rule {
    function upperCase(value: string): string {
        return value.toUpperCase();
    }

    function lowerCase(value: string): string {
        return value.toLowerCase();
    }

    function buildMemberParameters(member: Document) {
        let finalParameters: string = '';
        if (member.constructors && member.constructors.length) {
            const [{ parameters }] = member.constructors;
            if (parameters && parameters.length) {
                finalParameters = parameters
                    .map(p => `${p.name}: ${p.type}`)
                    .join(', ');
            }
        }
        return finalParameters;
    }
    
    function buildBodyFromMember(document: Document, member: Document): string {
        const [decorator] = member?.decorators ?? [];
        const httpMethod = decorator && decorator.name;
        const memberEnpoint = getEndpoint(document, member);
        const hasHttpParam = (endpoint: string): boolean => !!endpoint.trim().match(/\/\:\w+/g);

        let baseMemberContent = `
            this.http
            .${lowerCase(httpMethod)}<${strings.classify(member.returnType as string)}>
        `.replace(/(\r\n|\n|\r|\s)/gm, '');

        if (member.constructors && member.constructors.length) {
            // const parameterUrl = `API_BASE + ${upperCase(strings.underscore(member.name))}`;
            const [{ parameters }] = member.constructors;

            if (parameters) {
                if (hasHttpParam(memberEnpoint)) {
                    baseMemberContent = parseWithHttpParam(parameters, member, baseMemberContent);
                }
            }
        }

        return baseMemberContent;
    }

    function parseWithHttpParam(parameters: Document[], member: Document, baseMemberContent: string) {
        const httpParams = parameters
            .filter(p => {
                if (p.decorators
                    && p.decorators.length
                    && p.decorators.some(d => d.name === 'Param')) {
                    return true;
                }

                return false;
            })
            .map(p => {
                let paramKey = p.name;
                if (p.decorators && p.decorators[0].arguments) {
                    paramKey = p.decorators[0].arguments[0].name;
                }
                return {
                    name: p.name,
                    paramKey,
                };
            });

        if (httpParams && httpParams.length) {
            let url = `const url = \`API_BASE + \$\{${upperCase(strings.underscore(member.name))}\}\``;
            for (const param of httpParams) {
                url = url + `.replace(':${param.paramKey}', ${param.name})\n`;
            }
            baseMemberContent = url + `\t${baseMemberContent}(url);`;
        }
        return baseMemberContent;
    }

    function getEndpoint(document: Document, member: Document) {
        let baseUrl = '';
        if (document.decorators?.length) {
            const [decorator] = document.decorators;
            if (decorator && decorator.arguments?.length) {
                baseUrl = decorator.arguments[0].name;
            }
        }

        let finalEndpoint = baseUrl.replace(/\'/g, '');

        const [decorator] = member.decorators ?? [];

        if (decorator && decorator.arguments && decorator.arguments.length) {
            const url = decorator.arguments
                .map(argument => argument.name)
                .join('/')
                .replace(/\'/g, '');

            finalEndpoint = `${finalEndpoint}/${url}`;
        }

        return finalEndpoint;
    }

    return (_: Tree, _context: SchematicContext) => {
        // if (!_options.document) {
        //   throw new SchematicsException('The argument document is required!');
        // }

        _options.document = document;

        const templateSource = apply(
            url('./files'),
            [
                applyTemplates({
                    ...strings,
                    lowerCase,
                    upperCase,
                    getEndpoint,
                    buildMemberParameters,
                    buildBodyFromMember,
                    name: _options.document.name,
                    members: _options.document.members,
                    document: _options.document,
                }),
                move(normalize(_options.path ?? ''))
            ]
        )

        return chain([
            mergeWith(templateSource)
        ]);
    };
}
