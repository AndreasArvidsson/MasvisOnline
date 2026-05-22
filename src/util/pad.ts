export function pad(value: number): string {
    return `0${value.toString()}`.slice(-2);
}
