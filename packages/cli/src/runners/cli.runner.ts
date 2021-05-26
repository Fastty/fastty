type RunnerFn = (binary: string, ...args: string[]) => void;

interface CliState {
    bin: string;
    command: string;
    args: Array<string>;
    runner: RunnerFn | null;
}

export class CliRunner {
    private _state!: CliState;

    constructor() {
        this.resetState();
    }

    private resetState() {
        this._state = {
            bin: '',
            command: '',
            args: [],
            runner: null,
        };
    }

    binary(bin: string): this {
        this._state.bin = bin;
        return this;
    }

    command(command: string): this {
        this._state.command = command;
        return this;
    }

    args(...args: string[]): this {
        this._state.args.push(...args);
        return this;
    }

    runner(runFn: RunnerFn): this {
        this._state.runner = runFn.bind(this);
        return this;
    }

    exec(): void {
        const { bin, command, args, runner } = this._state;
        if (!runner) {
            throw new Error('Any runner function was provided for execution.');
        }
        runner(bin, command, ...args);
        this.resetState();
    }
}
