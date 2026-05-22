type DefaultFormatter = (value: number) => string;

export function tickerLabelformatterTime(
    sampleRate: number,
    value: number,
    defaultFormatter: DefaultFormatter,
): string {
    return defaultFormatter(value / sampleRate);
}
