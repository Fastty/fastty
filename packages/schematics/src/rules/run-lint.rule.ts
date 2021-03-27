import { virtualFs } from '@angular-devkit/core';
import { Rule, Tree } from '@angular-devkit/schematics';

import { ESLint } from 'eslint';

export function getTouchedFiles(tree: Tree) {
    return tree.actions.reduce((files, action) => {
        return action.path.endsWith('.ts') ? files.concat([`${action.path}`]) : files;
    }, [] as Array<string>);
}

export function runLint(): Rule {
    return (tree: Tree) => {
        const eslint = new ESLint({
            fix: true,
            baseConfig: {
                root: true,
                env: {
                    browser: true,
                    es2021: true,
                },
                extends: [
                    'eslint:recommended',
                    'plugin:@typescript-eslint/recommended',
                    'prettier/@typescript-eslint', // Uses eslint-config-prettier to disable ESLint rules from @typescript-eslint/eslint-plugin that would conflict with prettier
                    'plugin:prettier/recommended', // Enables eslint-plugin-prettier and eslint-config-prettier. This will display prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
                ],
                parser: '@typescript-eslint/parser',
                parserOptions: {
                    ecmaVersion: 2016,
                },
                plugins: ['@typescript-eslint'],
                rules: {
                    quotes: ['error', 'single'],
                    'no-console': ['error', { allow: ['warn', 'error'] }],
                    '@typescript-eslint/explicit-module-boundary-types': 'off',
                },
            },
        });

        getTouchedFiles(tree).forEach(async (filePath) => {
            if (tree.exists(filePath)) {
                const bufferCode = tree.read(filePath) as ArrayBuffer;
                const code = virtualFs.fileBufferToString(bufferCode);

                const results = await eslint.lintText(code, {
                    filePath: `${process.cwd()}${filePath}`,
                });

                await ESLint.outputFixes(results);
            }
        });
    };
}
