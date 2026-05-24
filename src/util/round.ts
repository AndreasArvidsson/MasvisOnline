export function round(value: number, decimals: number): number {
    const multiplier = 10 ** decimals;
    return Math.round(value * multiplier) / multiplier;
}

export function roundFixed(value: number, decimals: number): string {
    return round(value, decimals).toFixed(decimals);
}
