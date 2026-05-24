import { roundFixed } from "./round";

export function toDb(value: number): number {
    return 20 * Math.log10(value);
}

export function toDbString(value: number, decimals: number): string {
    const db = toDb(value);
    return roundFixed(db, decimals);
}
