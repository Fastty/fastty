import { Document } from '../../interfaces/document.interface';

export interface AngularServiceSchema {
    document: Document;
    path?: string;
    project?: string;
}
