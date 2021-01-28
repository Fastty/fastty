export function flatten<T extends Array<unknown>>(a: T[]): T {
    return a.reduce<T>((accumulator, value) => accumulator.concat(value) as T, ([] as Array<unknown>) as T);
}
