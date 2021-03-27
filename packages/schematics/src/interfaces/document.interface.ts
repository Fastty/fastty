export interface Document {
    name: string;
    type: string;
    fileName?: string;
    returnType?: string;
    arguments?: Document[] | null;
    constructors?: Constructors[] | null;
    members?: Document[] | null;
    decorators?: Document[] | null;
}

export interface Constructors {
    parameters?: Document[];
}
