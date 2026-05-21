import Graph from "owp.graph-react";
import type { JSX } from "react";
import "./Overview.css";
import type { AnalysisFile } from "./types";
import { getBorder, getColor, getTitle, toDb } from "./util";
import { VersionTag } from "./VersionTag";

interface OverviewProps {
    files: AnalysisFile[];
}

export function Overview({ files }: OverviewProps): JSX.Element {
    return (
        <div className="main" id="main-overview">
            {files.map((f) => {
                const options: any = {
                    offset: 0,
                    interaction: {
                        trackMouse: false,
                        zoom: false,
                    },
                    title: getTitle(f.file.name),
                    border: getBorder(),
                    graph: {
                        compositeOperation: "darken",
                        lineWidth: 1.000001,
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

                if (f.isLoaded && f.channels) {
                    options.graph.dataY = f.channels.map((c) => c.graph);
                    options.graph.colors = [
                        getColor(0),
                        ...f.channels.map((c, i) => getColor(i + 1)),
                    ];
                } else {
                    options.spinner = {
                        show: true,
                        radius: 10,
                        lines: 9,
                        length: 10,
                        width: 5,
                    };
                }

                return (
                    <div key={f.key} className="graph-row">
                        <Graph
                            className="overview-graph-div"
                            options={options}
                        />
                        <div className="overview-graph-data-table">
                            <table>
                                {f.isLoaded && (
                                    <tbody>
                                        <tr>
                                            <td>Crest</td>
                                            <td>
                                                &nbsp;= {toDb(f.crest ?? 0, 1)}{" "}
                                                dB
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Peak</td>
                                            <td>
                                                &nbsp;= {toDb(f.peak ?? 0, 1)}{" "}
                                                dBFS
                                            </td>
                                        </tr>
                                    </tbody>
                                )}
                            </table>
                        </div>
                    </div>
                );
            })}

            <VersionTag />
        </div>
    );
}
