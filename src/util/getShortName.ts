import { namesShort } from "./channelData";

export function getShortName(index: number): string {
    if (index >= namesShort.length) {
        return `Ch${index}`;
    }
    return namesShort[index];
}
