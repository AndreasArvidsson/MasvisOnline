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
