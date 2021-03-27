import { strings } from '@angular-devkit/core';

import { lowerCase, upperCase } from '../utils';
import { getEndpoint, parseWithHttpParam, parseWithQueryParam } from './index';
import { Document } from '../interfaces/document.interface';

export function buildMemberParameters(member: Document) {
    let finalParameters = '';
    if (member.constructors && member.constructors.length) {
        const [{ parameters }] = member.constructors;
        if (parameters && parameters.length) {
            finalParameters = parameters.map((p) => `${p.name}: ${p.type}`).join(', ');
        }
    }
    return finalParameters;
}

export function buildBodyFromMember(document: Document, member: Document): string {
    const [decorator] = member?.decorators ?? [];
    const httpMethod = decorator && decorator.name;
    const memberEnpoint = getEndpoint(document, member);

    const hasHttpParam = (endpoint: string): boolean => !!endpoint.trim().match(/\/:\w+/g);
    const hasQueryParam = (parameters: Document[]): boolean =>
        parameters.some((p) => p.decorators && p.decorators.some((d) => d.name === 'Query'));
    const getBodyParam = (parameters: Document[]): Document | undefined =>
        parameters.find((p) => p.decorators && p.decorators.some((d) => d.name === 'Body'));

    let baseMemberContent = `return this.http.${lowerCase(httpMethod)}<${member.returnType}>`;

    if (member.constructors && member.constructors.length) {
        let httpClientArguments: string[] = [`API_BASE + ${upperCase(strings.underscore(member.name))}`];
        let prefixCode: string | undefined = undefined;
        const [{ parameters }] = member.constructors;

        if (parameters) {
            if (hasHttpParam(memberEnpoint)) {
                ({ httpClientArguments, prefixCode } = parseWithHttpParam(parameters, member));

                if (prefixCode) {
                    baseMemberContent = prefixCode + baseMemberContent;
                }

                if (hasQueryParam(parameters)) {
                    // both route param and query param
                    const parsedWithQueryParam = parseWithQueryParam(parameters, member.name, true);

                    httpClientArguments = httpClientArguments.concat(parsedWithQueryParam.httpClientArguments);

                    if (parsedWithQueryParam.prefixCode) {
                        baseMemberContent = parsedWithQueryParam.prefixCode + baseMemberContent;
                    }
                }
            } else if (hasQueryParam(parameters)) {
                ({ httpClientArguments, prefixCode } = parseWithQueryParam(parameters, member.name));

                if (prefixCode) {
                    baseMemberContent = prefixCode + baseMemberContent;
                }
            }

            const bodyParameter = getBodyParam(parameters);

            if (bodyParameter) {
                httpClientArguments.splice(1, 0, bodyParameter.name);
            }

            baseMemberContent += `(${httpClientArguments.join(', ')});`;
        }
    }

    return baseMemberContent;
}
