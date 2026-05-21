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

declare module "owp.glyphicons" {
    const Glyph: any;
    export default Glyph;
}

declare module "owp.graph-react" {
    const Graph: any;
    export default Graph;
}

declare module "owp.workers" {
    export default class Workers {
        public add<T>(
            worker: string,
            args?: unknown,
            transfer?: Transferable[],
        ): Promise<T>;
    }
}

declare module "*?worker" {
    const path: string;
    export default path;
}
