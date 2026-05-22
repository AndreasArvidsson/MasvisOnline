import { colors } from "./channelData";

export function getColor(index: number): string {
    if (index >= colors.length) {
        return "#000000";
    }
    return colors[index];
}
