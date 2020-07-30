import React, { useEffect } from "react";
import PropTypes from "prop-types";
import GraphReact from "./GraphReact";
import Static from "./Static";
import DSP from "./DSP";
import "./Detailed.css";

const Detailed = ({ file, isLoaded, isDetailed, calculateDetailed }) => {

    useEffect(() => {
        if (isLoaded && !isDetailed) {
            calculateDetailed(file);
        }
    }, [file, isLoaded, isDetailed]);

    const renderChannel = (channel, i) => {
        const crest = Static.toDb(channel.crest);
        const rms = Static.toDb(channel.rms);
        const peak = Static.toDb(channel.peak);
        const title = Static.getName(i + 1) + ": Crest=" + crest + "dB, RMS=" + rms + "dBFS, Peak=" + peak + "dBFS";

        const options = {
            graph: {
                dataY: [channel.graph],
                colors: [
                    Static.getColor(0),
                    Static.getColor(i + 1)
                ],
                names: [
                    Static.getName(0),
                    Static.getName(i + 1)
                ]
            },
            interaction: {
                smoothing: false
            },
            axes: {
                x: {
                    legendValueFormatter: Static.legendformatterTime.bind(null, file.sampleRate),
                    tickerValuePreFormatter: Static.tickerValuePreFormatter.bind(null, file.sampleRate),
                    tickerValuePostFormatter: Static.tickerValuePostFormatter.bind(null, file.sampleRate),
                    tickerLabelFormatter: Static.tickerLabelformatterTime.bind(null, file.sampleRate),
                    bounds: {
                        min: 0,
                        max: file.numSamples
                    }
                },
                y: {
                    legendValueFormatter: Static.legendformatterAmplitude.bind(null, 1),
                    ticker: Static.tickerAmplitude.bind(null, 1),
                    bounds: {
                        min: -1,
                        max: 1
                    }
                }
            },
            title: {
                label: title,
                align: "left",
                size: 17
            }
        };

        let highlight;
        if (channel.loudestPart) {
            const minOffset = Math.round(file.numSamples * 0.0004);
            const loudestPartOffset = file.sampleRate * 0.05;
            //Use a min offset so that the hightlight isn't to small.
            const offset = Math.max(minOffset, loudestPartOffset);
            const minIndex = Math.max(0, channel.loudestPart.index - offset);
            const maxIndex = minIndex + 2 * offset;
            highlight = {
                x1: minIndex,
                y1: null,
                x2: maxIndex,
                y2: null,
                color: "rgba(0,0,0,0.5)"
            };
        }

        return (
            <div className="detailed-graph-div" key={i}>
                <GraphReact options={options} highlight={highlight} />
            </div>
        );
    }

    const renderLoudestPart = () => {
        const i = file.channels.findIndex(c => !!c.loudestPart);
        const channel = file.channels[i];
        const loudestPart = channel.loudestPart;
        const title = "Loudest part (" + Static.getName(i + 1) + " ch, "
            + loudestPart.count + " samples >95% during 20ms at "
            + Static.round(loudestPart.index / file.sampleRate, 2) + "s)";
        //Number of samples for 50ms.
        const offset = file.sampleRate * 0.05;
        const minIndex = Math.max(0, loudestPart.index - offset);
        const maxIndex = minIndex + 2 * offset;

        const options = {
            graph: {
                dataY: [channel.graph],
                colors: [
                    Static.getColor(0),
                    Static.getColor(i + 1)
                ],
                names: [
                    Static.getName(0),
                    Static.getName(i + 1)
                ]
            },
            interaction: {
                smoothing: false
            },
            axes: {
                x: {
                    bounds: {
                        min: minIndex,
                        max: maxIndex
                    },
                    legendValueFormatter: Static.legendformatterTime.bind(null, file.sampleRate),
                    tickerValuePreFormatter: Static.tickerValuePreFormatter.bind(null, file.sampleRate),
                    tickerValuePostFormatter: Static.tickerValuePostFormatter.bind(null, file.sampleRate),
                    tickerLabelFormatter: Static.tickerLabelformatterTime.bind(null, file.sampleRate),
                },
                y: {
                    legendValueFormatter: Static.legendformatterAmplitude.bind(null, 1),
                    ticker: Static.tickerAmplitude.bind(null, 1),
                    bounds: {
                        min: -1,
                        max: 1
                    }
                }
            },
            title: {
                label: title,
                align: "left",
                size: 17
            }
        };

        return (
            <div className="detailed-graph-div">
                <GraphReact options={options} />
            </div>
        );
    };

    const renderAvgSpectrum = () => {
        const bufferSize = DSP.FFT.calculatePow2Size(file.sampleRate);
        const bandwidth = DSP.FFT.calculateBandwidth(bufferSize, file.sampleRate);

        function legendXValueFormatter(value) {
            return Static.round(DSP.FFT.binIndexToFreq(value, bandwidth), 5) + "Hz";
        }

        function tickerXValuePreFormatter(value) {
            return DSP.FFT.binIndexToFreq(value, bandwidth);
        }

        function tickerXValuePostFormatter(value) {
            return DSP.FFT.freqToBinIndex(value, bandwidth);
        }

        function tickerXLabelFormatter(value) {
            value = DSP.FFT.binIndexToFreq(value, bandwidth);
            if (value >= 1000) {
                value /= 1000;
                value += "k";
            }
            return value;
        }

        const title = "Normalized average spectrum, " + Math.ceil(file.duration) + " frames";
        const options = {
            graph: {
                dataY: file.channels.map(c => c.avgSpectrum),
                names: [
                    Static.getName(0),
                    ...file.channels.map((c, i) => Static.getName(i + 1))
                ],
                colors: [
                    Static.getColor(0),
                    ...file.channels.map((c, i) => Static.getColor(i + 1))
                ]
            },
            interaction: {
                smoothing: false
            },
            axes: {
                x: {
                    legendValueFormatter: legendXValueFormatter,
                    tickerValuePreFormatter: tickerXValuePreFormatter,
                    tickerValuePostFormatter: tickerXValuePostFormatter,
                    tickerLabelFormatter: tickerXLabelFormatter,
                    bounds: {
                        min: DSP.FFT.freqToBinIndex(10, bandwidth),
                        max: DSP.FFT.freqToBinIndex(20000, bandwidth)
                    },
                    log: true
                },
                y: {
                }
            },
            title: {
                label: title,
                align: "left",
                size: 17
            }
        };

        return (
            <div className="detailed-graph-left-div">
                <GraphReact options={options} />
            </div>
        );
    };

    const renderGraphs = () => {
        if (!isDetailed) {
            return <div>Loading...</div>
        }
        return (
            <React.Fragment>
                {file.channels.map(renderChannel)}
                {renderLoudestPart()}
                {renderAvgSpectrum()}
            </React.Fragment>
        );
    }

    return (
        <div>
            <h2 className="detailed-title ">
                {file.file.name}
            </h2>
            {renderGraphs()}
        </div>
    );
};

Detailed.propTypes = {
    file: PropTypes.object.isRequired,
    isLoaded: PropTypes.bool,
    isDetailed: PropTypes.bool,
    calculateDetailed: PropTypes.func.isRequired
};

export default Detailed;