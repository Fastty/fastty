import { Document } from '../interfaces/document.interface';

export function getEndpoint(document: Document, member: Document) {
    let baseUrl = '';
    if (document.decorators?.length) {
        const [decorator] = document.decorators;
        if (decorator && decorator.arguments?.length) {
            baseUrl = decorator.arguments[0].name;
        }
    }

    let finalEndpoint = baseUrl.replace(/'/g, '');

    const [decorator] = member.decorators ?? [];

    if (decorator && decorator.arguments && decorator.arguments.length) {
        const url = decorator.arguments
            .map((argument) => argument.name)
            .join('/')
            .replace(/'/g, '');

        finalEndpoint = `${finalEndpoint}/${url}`;
    }

    return finalEndpoint;
}
