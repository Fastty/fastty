import { strings } from '@angular-devkit/core';

import { upperCase } from '../utils/string.util';
import { Document } from '../interfaces/document.interface';
import { HttpClientParameters, HttpQueryParams } from '../interfaces/http.interface';

export function parseWithQueryParam(
    parameters: Document[],
    memberName: string,
    hasRouteParam = false,
): HttpClientParameters {
    const httpQueryParams = parameters
        .filter((p) => {
            if (p.decorators && p.decorators.length && p.decorators.some((d) => d.name === 'Query')) {
                return true;
            }

            return false;
        })
        .reduce<HttpQueryParams>(
            (acc, curr) => {
                const { arguments: args } = curr.decorators?.find((d) => d.name === 'Query') as Document;
                const [{ name: queryParamKey }] = args as Document[];
                const queryParamValue = curr.name;

                acc = {
                    params: {
                        ...acc.params,
                        [queryParamKey]: queryParamValue,
                    },
                };

                return acc;
            },
            { params: {} },
        );

    const httpClientArguments: string[] = [`API_BASE + ${upperCase(strings.underscore(memberName))}`];
    if (hasRouteParam) {
        httpClientArguments.splice(0, 1, 'url');
    }

    if (httpQueryParams) {
        httpClientArguments.push(JSON.stringify(httpQueryParams).replace(/"/g, ''));
    }

    return { httpClientArguments };
}

export function parseWithHttpParam(parameters: Document[], member: Document): HttpClientParameters {
    const httpParams = parameters
        .filter((p) => {
            if (p.decorators && p.decorators.length && p.decorators.some((d) => d.name === 'Param')) {
                return true;
            }

            return false;
        })
        .map((p) => {
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
    };
}
