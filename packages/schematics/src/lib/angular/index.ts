import { normalize, strings } from '@angular-devkit/core';
import {
  apply,
  applyTemplates,
  chain,
  mergeWith,
  move,
  Rule,
  SchematicContext,
  Tree,
  url,
} from '@angular-devkit/schematics';
import { Document } from '../../interfaces/document.interface';

import { AngularServiceSchema } from './schema';

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

    _options.document = {
      name: 'Cats',
      type: 'typeof CatsController',
      decorators: [
        {
          name: 'Controller',
          type: 'any',
          arguments: [{ name: 'cats', type: '"cats"' }],
          constructors: []
        }
      ],
      members: [
        {
          name: 'create',
          type: '(createCatDto: CreateCatDto) => Promise<void>',
          returnType: 'void',
          constructors: [
            {
              parameters: [{ name: 'createCatDto', type: 'CreateCatDto' }]
            }
          ],
          decorators: [
            {
              name: 'Post',
              type: 'any',
              arguments: [{ name: 'create/cat', type: '"create/cat"' }],
              constructors: []
            }
          ]
        },
        {
          name: 'findAll',
          type: '() => Promise<Cat[]>',
          returnType: 'Cat[]',
          constructors: [{ parameters: [] }],
          decorators: [{ name: 'Get', type: 'any', arguments: [], constructors: [] }]
        }
      ],
      fileName: '/home/felipe-pc/projects/fastty/packages/core/src/resource/cat.controller.ts'
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
          name: _options.document.name,
          members: _options.document.members,
          document: _options.document,
        }),
        move(normalize(_options.path ?? ''))
      ]
    )

    return chain([
      mergeWith(templateSource)
    ]);
  };
}
