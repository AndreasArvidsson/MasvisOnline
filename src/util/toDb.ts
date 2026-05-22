import { round } from "./round";

export function toDb(value: number, decimals?: number): number {
    if (decimals != null) {
        return round(20 * Math.log10(value), decimals);
    }
    return 20 * Math.log10(value);
}
