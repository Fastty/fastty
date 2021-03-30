import { ANGULAR_SCHEMATICS_BIN_PATH } from '../constants/angular-schematics-path';

export function loadSchematicsBinary() {
    try {
        return require.resolve(ANGULAR_SCHEMATICS_BIN_PATH, { paths: module.paths });
    } catch (err) {
        throw new Error(`schematics binary could not be found.\nError: ${err}`);
    }
}
