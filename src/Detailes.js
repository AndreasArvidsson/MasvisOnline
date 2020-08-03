import Graph from "owp.graph-react";
import React, { useEffect } from "react";
import PropTypes from "prop-types";
import Static from "./Static";
import DSP from "./DSP";
import "./Detailes.css";

const yWidth = 40;

const Detailes = ({ file, isLoaded, isDetailed, calculateDetailes }) => {

    useEffect(() => {
        if (isLoaded && !isDetailed) {
            calculateDetailes(file);
        }
    }, [file, isLoaded, isDetailed]);

    const renderChannel = (channel, i) => {
        const crest = Static.toDb(channel.crest);
        const rms = Static.toDb(channel.rms);
        const peak = Static.toDb(channel.peak);
        const title = Static.getName(i + 1) + ": Crest=" + crest + "dB, RMS=" + rms + "dBFS, Peak=" + peak + "dBFS";

        const options = {
            interaction: {
                trackMouse: false,
            },
            title: Static.getTitle(title),
            border: Static.getBorder(),
            graph: {
                dataY: [channel.graph],
                colors: [
                    Static.getColor(0),
                    Static.getColor(i + 1)
                ]
            },
            axes: {
                x: {
                    tickerValuePreFormatter: Static.tickerValuePreFormatter.bind(null, file.sampleRate),
                    tickerValuePostFormatter: Static.tickerValuePostFormatter.bind(null, file.sampleRate),
                    tickerLabelFormatter: Static.tickerLabelformatterTime.bind(null, file.sampleRate),
                    bounds: {
                        min: 0,
                        max: file.numSamples
                    }
                },
                y: {
                    ticker: Static.tickerAmplitude,
                    width: yWidth,
                    bounds: {
                        min: -1,
                        max: 1
                    }
                }
            },
            highlight: {
                xMin: null,
                xMax: null,
                yMin: null,
                yMax: null,
                color: "rgba(0,0,0,0.5)"
            }
        };

        if (channel.loudestPart) {
            const minOffset = Math.round(file.numSamples * 0.0004);
            const loudestPartOffset = file.sampleRate * 0.05;
            //Use a min offset so that the hightlight isn't to small.
            const offset = Math.max(minOffset, loudestPartOffset);
            const minIndex = Math.max(0, channel.loudestPart.index - offset);
            const maxIndex = minIndex + 2 * offset;
            options.highlight.xMin = minIndex;
            options.highlight.xMax = maxIndex;
        }

        return <Graph key={i} className="detailed-graph-div" options={options} />;
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
            interaction: {
                trackMouse: false
            },
            title: Static.getTitle(title),
            border: Static.getBorder(),
            graph: {
                dataY: [channel.graph],
                colors: [
                    Static.getColor(0),
                    Static.getColor(i + 1)
                ]
            },
            axes: {
                x: {
                    bounds: {
                        min: minIndex,
                        max: maxIndex
                    },
                    tickerValuePreFormatter: Static.tickerValuePreFormatter.bind(null, file.sampleRate),
                    tickerValuePostFormatter: Static.tickerValuePostFormatter.bind(null, file.sampleRate),
                    tickerLabelFormatter: Static.tickerLabelformatterTime.bind(null, file.sampleRate),
                },
                y: {
                    width: yWidth,
                    ticker: Static.tickerAmplitude,
                    bounds: {
                        min: -1,
                        max: 1
                    }
                }
            }
        };

        return <Graph className="detailed-graph-div" options={options} />;
    };

    const renderAvgSpectrum = () => {
        const bufferSize = DSP.FFT.calculatePow2Size(file.sampleRate);
        const bandwidth = DSP.FFT.calculateBandwidth(bufferSize, file.sampleRate);

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

        function tickerYLabelFormatter(value) {
            if (value === -10) {
                return "dB";
            }
            return value;
        }

        const title = "Normalized average spectrum, " + Math.ceil(file.duration) + " frames";

        const options = {
            interaction: {
                trackMouse: false,
            },
            title: Static.getTitle(title),
            border: Static.getBorder(),
            graph: {
                dataY: file.channels.map(c => c.avgSpectrum),
                colors: [
                    Static.getColor(0),
                    ...file.channels.map((c, i) => Static.getColor(i + 1))
                ]
            },
            axes: {
                x: {
                    tickerValuePreFormatter: tickerXValuePreFormatter,
                    tickerValuePostFormatter: tickerXValuePostFormatter,
                    tickerLabelFormatter: tickerXLabelFormatter,
                    bounds: {
                        min: DSP.FFT.freqToBinIndex(20, bandwidth),
                        max: DSP.FFT.freqToBinIndex(20000, bandwidth)
                    },
                    log: true
                },
                y: {
                    width: yWidth,
                    tickerLabelFormatter: tickerYLabelFormatter,
                    bounds: {
                        min: -90,
                        max: -10
                    }
                }
            }
        };

        return <Graph className="detailed-graph-left-div" options={options} />;
    };

    const renderAllpass = () => {
        const max = toDb(file.allpass.maxCrest);
        const ticks = [];
        for (let i = 0; ; i += 5) {
            ticks.push({
                value: i,
                label: i
            });
            if (i > max) {
                break;
            }
        }
        ticks[ticks.length - 1].label = "dB";

        const dataY = [];
        const colors = [Static.getColor(0)];
        const dashed = [];
        file.channels.forEach((c, i) => {
            const color = Static.getColor(i + 1);
            dataY.push(c.allpass.map(toDb));
            colors.push(color);
            dashed.push(false)
            dataY.push(new Array(c.allpass.length).fill(toDb(c.crest)));
            colors.push(color);
            dashed.push(true)
        });

        const options = {
            interaction: {
                trackMouse: false
            },
            title: Static.getTitle("Allpassed crest factor"),
            border: Static.getBorder(),
            graph: {
                dataX: [file.allpass.freqs],
                dataY,
                colors,
                dashed
            },
            axes: {
                x: {
                    bounds: {
                        min: file.allpass.freqs[0],
                        max: file.allpass.freqs[file.allpass.freqs.length - 1]
                    },
                    log: true
                },
                y: {
                    width: yWidth,
                    ticker: () => ticks,
                    bounds: {
                        min: 0,
                        max: ticks[ticks.length - 1].value
                    }
                }
            }
        };

        return <Graph className="detailed-graph-right-div" options={options} />;
    };

    const renderHistogram = () => {
        const maxValue = Math.pow(2, file.bitDepth - 1) - 1;

        function valueToIndex(value) {
            return Math.round((value + 1) * maxValue);
        }

        const ticks = [];
        for (let i = -1; i <= 1; i += 0.2) {
            i = Static.round(i, 1);
            ticks.push({
                value: valueToIndex(i),
                label: i
            });
        }

        const peak = Math.max(...file.channels.map(c => c.histogram.peak));
        const bits = file.channels.map(c => Static.round(c.histogram.bits, 1));
        const options = {
            interaction: {
                trackMouse: false
            },
            title: Static.getTitle(`Histogram, "bits": ${bits.join("/")}`),
            border: Static.getBorder(),
            graph: {
                dataY: file.channels.map(c => c.histogram.graph),
                colors: [
                    Static.getColor(0),
                    ...file.channels.map((c, i) => Static.getColor(i + 1))
                ]
            },
            axes: {
                x: {
                    bounds: {
                        min: valueToIndex(-1.1),
                        max: valueToIndex(1.1)
                    },
                    ticker: () => ticks
                },
                y: {
                    width: yWidth,
                    log: true,
                    bounds: {
                        min: 1,
                        max: peak
                    }
                }
            }
        };

        return <Graph className="detailed-graph-left-div" options={options} />;
    };

    const renderGraphs = () => {
        if (!isDetailed) {
            return <div>Loading...</div>
        }
        return (
            <React.Fragment>
                {file.channels.map(renderChannel)}
                {renderLoudestPart()}
                <div className="graph-row">
                    {renderAvgSpectrum()}
                    {renderAllpass()}
                </div>
                <div className="graph-row">
                    {renderHistogram()}
                </div>
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

Detailes.propTypes = {
    file: PropTypes.object.isRequired,
    isLoaded: PropTypes.bool,
    isDetailed: PropTypes.bool,
    calculateDetailes: PropTypes.func.isRequired
};

export default Detailes;

function toDb(value) {
    return 20 * Static.log10(value);
}