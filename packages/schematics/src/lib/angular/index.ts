import { normalize, strings } from '@angular-devkit/core';
import {
    apply,
    applyTemplates,
    chain,
    MergeStrategy,
    mergeWith,
    move,
    Rule,
    SchematicContext,
    Tree,
    url,
} from '@angular-devkit/schematics';

import { runLint } from '../../rules';
import { AngularServiceSchema } from './schema';
import { lowerCase, upperCase } from '../../utils';
import { getEndpoint, buildBodyFromMember, buildMemberParameters } from '../../helpers';
import { Document } from '../../interfaces/document.interface';
import { isTypeOf } from '../../utils/isTypeOf';

export function schematics(options: AngularServiceSchema): Rule {
    return (_: Tree, _context: SchematicContext) => {
        const document = JSON.parse(options.document);

        if (isTypeOf<Document>(document, true, 'name', 'members')) {
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
                        name: document.name,
                        members: document.members,
                        document,
                    }),
                    move(normalize(options.path ?? '')),
                    runLint(),
                ],
            )
    
            return chain([
                mergeWith(templateSource, MergeStrategy.Overwrite),
            ]);
        }
    };
}
