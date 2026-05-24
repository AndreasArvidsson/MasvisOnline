export function round(value: number, decimals: number): string {
    const multiplier = 10 ** decimals;
    const rounded = Math.round(value * multiplier) / multiplier;
    return rounded.toFixed(decimals);
}
