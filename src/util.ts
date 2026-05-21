type DefaultFormatter = (value: number) => string;

export function pad(value: number): string {
    return `0${value.toString()}`.slice(-2);
}

export function tickerLabelformatterTime(
    sampleRate: number,
    value: number,
    defaultFormatter: DefaultFormatter,
): string {
    return defaultFormatter(value / sampleRate);
}

export function tickerValuePreFormatter(max: number, value: number): number {
    return value / max;
}

export function tickerValuePostFormatter(max: number, value: number): number {
    return value * max;
}

export function toDb(value: number, decimals?: number): number {
    if (decimals != null) {
        return round(20 * Math.log10(value), decimals);
    }
    return 20 * Math.log10(value);
}

export function round(value: number, decimals: number): number {
    const multiplier = 10 ** decimals;
    return Math.round(value * multiplier) / multiplier;
}

export function getColor(index: number): string {
    if (index >= colors.length) {
        return "#000000";
    }
    return colors[index];
}

export function getName(index: number): string {
    if (index >= names.length) {
        return `Ch${index}`;
    }
    return names[index];
}

export function getShortName(index: number): string {
    if (index >= namesShort.length) {
        return `Ch${index}`;
    }
    return namesShort[index];
}

export function getTitle(title: string): {
    label: string;
    align: string;
    size: number;
    padding: number;
} {
    return {
        label: title,
        align: "left",
        size: 17,
        padding: 0,
    };
}

export function getBorder(): { width: string } {
    return {
        width: "1px",
    };
}

const colors = [
    "#000000",
    "#0000FF",
    "#FF0000",
    "#800080",
    "#00FF00",
    "#8080FF",
    "#FF8080",
    "#FF00FF",
    "#00FFFF",
];
const names = [
    "Time(S)",
    "Left",
    "Right",
    "Center",
    "LFE",
    "Surr left",
    "Surr right",
    "Surr back left",
    "Surr back right",
];
const namesShort = ["S", "L", "R", "C", "LFE", "SL", "SR", "SBL", "SBR"];
