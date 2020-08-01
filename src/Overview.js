import Graph from "owp.graph-react"; //TODO
import React from "react";
import PropTypes from "prop-types";
import Static from "./Static";
import "./Overview.css";

const Overview = ({ files }) => {
    return (
        <div>
            {files.map(f => {

                const options = {
                    interaction: {
                        resize: true,
                        smoothing: false,
                        trackMouse: false,
                        zoom: false
                    },
                    title: {
                        label: f.file.name,
                        bold: true
                    },
                    graph: {
                        compositeOperation: "darken",
                        lineWidth: 1.000001
                    },
                    axes: {
                        x: {},
                        y: {
                            width: 30,
                            ticker: Static.tickerAmplitude,
                            bounds: {
                                min: -1,
                                max: 1
                            }
                        }
                    },
                    spinner: {
                        show: false
                    }
                };

                if (f.isLoaded) {
                    options.graph.dataY = f.channels.map(c => c.graph);
                    options.axes.x = {
                        tickerValuePreFormatter: Static.tickerValuePreFormatter.bind(null, f.sampleRate),
                        tickerValuePostFormatter: Static.tickerValuePostFormatter.bind(null, f.sampleRate),
                        tickerLabelFormatter: Static.tickerLabelformatterTime.bind(null, f.sampleRate),
                        bounds: {
                            min: 0,
                            max: f.numSamples
                        }
                    }
                }
                else {
                    options.spinner = {
                        show: true,
                        radius: 15,
                        lines: 10,
                        length: 20,
                        width: 7
                    };
                }

                return (
                    <div key={f.file.name} className="overview-graph-wrapper-div">
                        <Graph className="overview-graph-div" options={options} />
                        <table className="table overview-graph-data-table">
                            {f.isLoaded &&
                                <tbody>
                                    <tr><td>#Ch:</td><td>{f.numChannels}</td></tr>
                                    <tr><td>Crest:</td><td>{Static.toDb(f.crest)}dB</td></tr>
                                    <tr><td>Peak:</td><td>{Static.toDb(f.peak)}dBFS</td></tr>
                                    <tr><td>RMS:</td><td>{Static.toDb(f.rms)}dBFS</td></tr>
                                </tbody>
                            }
                        </table>
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