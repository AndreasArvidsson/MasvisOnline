import type { GraphOptions } from "owp.graph-react";
import Graph from "owp.graph-react";
import "owp.graph-react/style.css";
import type { JSX } from "react";
import { memo } from "react";
import "./Overview.css";
import type { AnalysisFile } from "./types";
import { getBorder } from "./util/getBorder";
import { getColor } from "./util/getColor";
import { getTitle } from "./util/getTitle";
import { toDbString } from "./util/toDb";
import { VersionTag } from "./VersionTag";

interface OverviewProps {
    files: AnalysisFile[];
}

export function Overview({ files }: OverviewProps): JSX.Element {
    return (
        <div id="main-overview">
            {files.map((f) => (
                <OverviewFile key={f.key} file={f} type={f.type} />
            ))}

            <VersionTag />
        </div>
    );
}

interface OverviewFileProps {
    file: AnalysisFile;
    type: AnalysisFile["type"];
}

const OverviewFile = memo(
    ({ file: f }: OverviewFileProps): JSX.Element => {
        const options: GraphOptions = {
            offset: 0,
            interaction: {
                trackMouse: false,
                zoom: false,
            },
            title: getTitle(f.file.name),
            border: getBorder(),
            graph: {
                compositeOperation: "darken",
                lineWidth: 1.000_001,
            },
            axes: {
                x: {
                    show: false,
                },
                y: {
                    show: false,
                },
            },
            spinner: {
                show: false,
            },
        };

        if (f.type === "unloaded") {
            options.spinner = {
                show: true,
                radius: 10,
                lines: 9,
                length: 10,
                width: 5,
            };
        } else if (f.type !== "failed") {
            options.graph = {
                ...options.graph,
                dataY: f.channels.map((c) => c.graph),
                colors: [
                    getColor(0),
                    ...f.channels.map((c, i) => getColor(i + 1)),
                ],
            };
        }

        return (
            <div key={f.key} className="graph-row">
                <Graph className="overview-graph-div" options={options} />
                <div className="overview-graph-data-table">
                    {f.type !== "unloaded" && f.type !== "failed" && (
                        <table>
                            <tbody>
                                <tr>
                                    <td>Crest</td>
                                    <td>&nbsp;= {toDbString(f.crest, 1)} dB</td>
                                </tr>
                                <tr>
                                    <td>Peak</td>
                                    <td>
                                        &nbsp;= {toDbString(f.peak, 1)} dBFS
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        );
    },
    (prevProps, nextProps) =>
        prevProps.file.key === nextProps.file.key &&
        prevProps.type === nextProps.type,
);

OverviewFile.displayName = "OverviewFile";
