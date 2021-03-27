export interface HttpClientParameters {
    httpClientArguments: string[];
    prefixCode?: string;
}

export interface HttpQueryParams {
    params: {
        [param: string]: string | string[];
    };
}
