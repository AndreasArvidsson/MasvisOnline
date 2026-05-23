import type { GraphOptions } from "owp.graph-react";

export function getTitle(title: string): GraphOptions["title"] {
    return {
        label: title,
        align: "left",
        size: 17,
        padding: 0,
    };
}
