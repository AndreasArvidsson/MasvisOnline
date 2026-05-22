type Arg = string | undefined | false;

export function classNames(...args: Arg[]): string | undefined {
    return args.filter(Boolean).join(" ") || undefined;
}
