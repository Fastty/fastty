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
    SchematicsException,
    Tree,
    url,
} from '@angular-devkit/schematics';

import { runLint } from '../../rules';
import { AngularServiceSchema } from './schema';
import { lowerCase, upperCase } from '../../utils';
import { getEndpoint, buildBodyFromMember, buildMemberParameters } from '../../helpers';

export function schematics(options: AngularServiceSchema): Rule {
    return (_: Tree, _context: SchematicContext) => {
        if (!options.document || !Object.keys(options.document).length) {
          throw new SchematicsException('The argument document is required!');
        }

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
                    name: options.document.name,
                    members: options.document.members,
                    document: options.document,
                }),
                move(normalize(options.path ?? '')),
                runLint(),
            ],
        )

        return chain([
            mergeWith(templateSource, MergeStrategy.Overwrite),
        ]);
    };
}
