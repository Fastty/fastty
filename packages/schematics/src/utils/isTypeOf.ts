import { SchematicsException } from '@angular-devkit/schematics';

/* eslint-disable @typescript-eslint/no-explicit-any */
export function isTypeOf<T>(obj: any, shouldThrow = false, ...keys: Array<keyof T>): obj is T {
    const errors = keys.reduce((acc: any, curr) => {
        if (!(curr in obj)) {
            acc = {
                errors: {
                    ...acc?.errors,
                    [curr]: 'key not present into passed object',
                },
            };
        }

        return acc;
    }, null);

    if (shouldThrow && errors) {
        throw new SchematicsException(`Validation type of Error:\n${JSON.stringify(errors)}`);
    }

    return errors ? false : true;
}
