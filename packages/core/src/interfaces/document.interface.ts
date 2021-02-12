import { Nullable } from '../utils';

export interface Document {
    name: string;
    type: string;
    fileName?: string;
    returnType?: string;
    arguments?: Nullable<Document>[];
    constructors?: Nullable<Constructors>[];
    members?: Nullable<Document>[];
    decorators?: Nullable<Document>[];
}

export interface Constructors {
    parameters?: Document[];
}
