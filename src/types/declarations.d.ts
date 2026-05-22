declare module "owp.feedback" {
    const Feedback: {
        error(error: unknown, options?: { sticky?: boolean }): void;
    };
    export default Feedback;
}

declare module "owp.get-html-as-image" {
    export default function downloadImage(
        elementId: string,
        filename: string,
    ): void;
}

declare module "owp.graph-react" {
    import type { ComponentType, HTMLAttributes } from "react";
    import type { GraphOptions } from "./GraphOptions";

    interface GraphProps extends HTMLAttributes<HTMLDivElement> {
        options: GraphOptions;
    }

    const Graph: ComponentType<GraphProps>;
    export default Graph;
}

declare module "owp.workers" {
    export default class Workers {
        public add<T>(
            worker: string | workerConstructor,
            args?: unknown,
            transfer?: Transferable[],
        ): Promise<T>;
    }
}
