import { names } from "./channelData";

export function getName(index: number): string {
    if (index >= names.length) {
        return `Ch${index}`;
    }
    return names[index];
}
