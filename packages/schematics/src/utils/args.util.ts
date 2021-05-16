export function isDryRun(): boolean {
    const dryRunArg = process.argv.find((arg) => arg.startsWith('--dry-run') || arg.startsWith('-d'));

    if (!dryRunArg) {
        return false;
    }

    return !dryRunArg.includes('false');
}
