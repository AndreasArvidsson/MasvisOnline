import Graph from "owp.graph-react";
import React from "react";
import PropTypes from "prop-types";
import Static from "./Static";
import "./Overview.css";

const Overview = ({ files }) => {
    return (
        <div className="main" id="main-overview">
            {files.map(f => {

                const options = {
                    interaction: {
                        trackMouse: false,
                        zoom: false
                    },
                    title: Static.getTitle(f.file.name),
                    border: Static.getBorder(),
                    graph: {
                        compositeOperation: "darken",
                        lineWidth: 1.000001
                    },
                    axes: {
                        x: {
                            show: false
                        },
                        y: {
                            show: false
                        }
                    },
                    spinner: {
                        show: false
                    }
                };

                if (f.isLoaded) {
                    options.graph.dataY = f.channels.map(c => c.graph);
                    options.graph.colors = [
                        Static.getColor(0),
                        ...f.channels.map((c, i) => Static.getColor(i + 1))
                    ];
                }
                else {
                    options.spinner = {
                        show: true,
                        radius: 10,
                        lines: 9,
                        length: 10,
                        width: 5
                    };
                }

                return (
                    <div key={f.file.name} className="graph-row">
                        <Graph className="overview-graph-div" options={options} />
                        <div className="overview-graph-data-table">
                            <table>
                                {f.isLoaded &&
                                    <tbody>
                                        <tr><td>Crest</td><td>&nbsp;= {Static.toDb(f.crest, 1)} dB</td></tr>
                                        <tr><td>Peak</td><td>&nbsp;= {Static.toDb(f.peak, 1)} dBFS</td></tr>
                                    </tbody>
                                }
                            </table>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

Overview.propTypes = {
    files: PropTypes.array.isRequired
};

export default Overview;