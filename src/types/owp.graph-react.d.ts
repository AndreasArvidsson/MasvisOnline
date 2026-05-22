declare module "owp.graph-react" {
    import type { ComponentType, HTMLAttributes } from "react";
    import type { GraphOptions } from "./GraphOptions";

    interface GraphProps extends HTMLAttributes<HTMLDivElement> {
        options: GraphOptions;
    }

    const Graph: ComponentType<GraphProps>;
    export default Graph;
}
