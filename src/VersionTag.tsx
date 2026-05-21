import type { JSX } from "react";
import packageJson from "../package.json";
import { pad } from "./util";

export function VersionTag(): JSX.Element {
    const date = new Date();
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    return (
        <div className="versionTag">
            <span>
                MasVis online v{packageJson.version}
                {" @ "}
                {year}-{month}-{day}
            </span>
        </div>
    );
}
