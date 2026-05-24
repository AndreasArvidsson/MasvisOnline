import { round } from "./round";

type DefaultFormatter = (value: number) => string;

export function tickerLabelformatterTime(
    sampleRate: number,
    value: number,
    defaultFormatter: DefaultFormatter,
): string {
    return defaultFormatter(round(value / sampleRate, 2));
}
