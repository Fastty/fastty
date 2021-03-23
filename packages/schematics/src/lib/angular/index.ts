import { normalize, strings } from '@angular-devkit/core';
import {
    apply,
    applyTemplates,
    chain,
    forEach,
    mergeWith,
    move,
    Rule,
    SchematicContext,
    Tree,
    url,
} from '@angular-devkit/schematics';

import { ESLint } from 'eslint';

import { AngularServiceSchema } from './schema';
import { Document } from '../../interfaces/document.interface';
import { document } from './resource/document-resource';

interface HttpClientParameters {
    httpClientArguments: string[];
    prefixCode?: string;
}

interface HttpQueryParams {
    params: {
        [param: string]: string | string[];
    };
}

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
        const hasQueryParam = (parameters: Document[]): boolean =>
            parameters.some(p =>
                p.decorators && p.decorators.some(d => d.name === 'Query')
            )
        const getBodyParam = (parameters: Document[]): Document | undefined =>
            parameters.find(p =>
                p.decorators && p.decorators.some(d => d.name === 'Body')
            )

        let baseMemberContent = 
            `return this.http.${lowerCase(httpMethod)}<${member.returnType}>`;

        if (member.constructors && member.constructors.length) {
            let httpClientArguments: string[] = [`API_BASE + ${upperCase(strings.underscore(member.name))}`];
            let prefixCode: string | undefined = undefined;
            const [{ parameters }] = member.constructors;

            if (parameters) {
                if (hasHttpParam(memberEnpoint)) {
                    ({ httpClientArguments, prefixCode } =
                        parseWithHttpParam(parameters, member));

                    if (prefixCode) {
                        baseMemberContent = prefixCode + baseMemberContent;
                    }

                    if (hasQueryParam(parameters)) { // both route param and query param
                        const parsedWithQueryParam =
                            parseWithQueryParam(parameters, member.name, true);
    
                        httpClientArguments = httpClientArguments
                            .concat(parsedWithQueryParam.httpClientArguments);

                        if (parsedWithQueryParam.prefixCode) {
                            baseMemberContent = parsedWithQueryParam.prefixCode + baseMemberContent;
                        }
                    }
                } else if (hasQueryParam(parameters)) {
                    ({ httpClientArguments, prefixCode } =
                        parseWithQueryParam(parameters, member.name));

                    if (prefixCode) {
                        baseMemberContent = prefixCode + baseMemberContent;
                    }
                }

                const bodyParameter = getBodyParam(parameters);

                if (!!bodyParameter) {
                    httpClientArguments.splice(1, 0, bodyParameter.name);
                }

                baseMemberContent += `(${httpClientArguments.join(', ')});`;
            }
        }

        return baseMemberContent;
    }

    function parseWithQueryParam(parameters: Document[], memberName: string, hasRouteParam = false): HttpClientParameters {
        const httpQueryParams = parameters
            .filter(p => {
                if (p.decorators
                    && p.decorators.length
                    && p.decorators.some(d => d.name === 'Query')) {
                    return true;
                }

                return false;
            })
            .reduce<HttpQueryParams>((acc, curr) => {
                const { arguments: args } = curr.decorators?.find(d => d.name === 'Query') as Document;
                const [ { name: queryParamKey } ] = args as Document[];
                const queryParamValue = curr.name;

                acc = {
                    params: {
                        ...acc.params,
                        [queryParamKey]: queryParamValue,
                    }
                };

                return acc;
            }, { params: {} });


        const httpClientArguments: string[] = [`API_BASE + ${upperCase(strings.underscore(memberName))}`];
        if (hasRouteParam) {
            httpClientArguments.splice(0, 1, 'url');
        }

        if (httpQueryParams) {
            httpClientArguments.push(
                JSON.stringify(httpQueryParams).replace(/\"/g, '')
            );
        }

        return { httpClientArguments };
    }

    function parseWithHttpParam(parameters: Document[], member: Document): HttpClientParameters {
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

        let url = '';
        if (httpParams && httpParams.length) {
            url = `const url = API_BASE + ${upperCase(strings.underscore(member.name))}`;
            for (const param of httpParams) {
                url = url + `.replace(':${param.paramKey}', ${param.name})\n`;
            }
        }

        return {
            httpClientArguments: ['url'],
            prefixCode: url,
        }
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

        const eslint = new ESLint({ fix: true });

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
                move(normalize(_options.path ?? '')),
                forEach((fileEntry) => {
                    setTimeout(async () => {
                        const results = await eslint.lintFiles([`/home/felipe-pc/projects/fastty/packages/schematics/cats-controller.service.ts`]);
                        await ESLint.outputFixes(results);
                        const formatter = await eslint.loadFormatter('stylish');
                        const formated = formatter.format(results);

                        _.overwrite(normalize(fileEntry.path), formated);
                    }, 100);
    
                    return fileEntry;
                }),
            ],
        )

        return chain([
            mergeWith(templateSource),
        ]);
    };
}
