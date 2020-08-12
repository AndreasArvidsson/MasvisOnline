import Graph from "owp.graph-react";
import React, { useEffect } from "react";
import PropTypes from "prop-types";
import Static from "./Static";
import DSP from "./DSP";
import "./Detailes.css";

const Detailes = ({ file, isLoaded, isDetailed, calculateDetailes }) => {

    useEffect(() => {
        if (isLoaded && !isDetailed) {
            calculateDetailes(file);
        }
    }, [file, isLoaded, isDetailed]);

    const renderChannel = (channel, i) => {
        const crest = Static.toDb(channel.crest, 2);
        const rms = Static.toDb(channel.rms, 2);
        const peak = Static.toDb(channel.peak, 2);
        const title = Static.getName(i + 1)
            + ": Crest=" + crest
            + " dB, RMS="
            + rms
            + " dBFS, Peak="
            + peak + " dBFS";

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
                    numTicks: 20,
                    tickerValuePreFormatter: Static.tickerValuePreFormatter.bind(null, file.sampleRate),
                    tickerValuePostFormatter: Static.tickerValuePostFormatter.bind(null, file.sampleRate),
                    tickerLabelFormatter: Static.tickerLabelformatterTime.bind(null, file.sampleRate),
                    bounds: {
                        min: 0,
                        max: file.numSamples
                    }
                },
                y: {
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

        return <Graph key={i} className="detailes-graph-channel" options={options} />;
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
                    numTicks: 20,
                    tickerValuePreFormatter: Static.tickerValuePreFormatter.bind(null, file.sampleRate),
                    tickerValuePostFormatter: Static.tickerValuePostFormatter.bind(null, file.sampleRate),
                    tickerLabelFormatter: Static.tickerLabelformatterTime.bind(null, file.sampleRate),
                    bounds: {
                        min: minIndex,
                        max: maxIndex
                    }
                },
                y: {
                    width: yWidth,
                    bounds: {
                        min: -1,
                        max: 1
                    }
                }
            }
        };

        return <Graph className="detailes-graph-channel" options={options} />;
    };

    const renderAvgSpectrum = () => {
        const bufferSize = DSP.FFT.calculatePow2Size(file.sampleRate);
        const bandwidth = DSP.FFT.calculateBandwidth(bufferSize, file.sampleRate);
        const maxFreq = 20000;

        function tickerXValuePreFormatter(value) {
            return DSP.FFT.binIndexToFreq(value, bandwidth);
        }

        function tickerXValuePostFormatter(value) {
            return DSP.FFT.freqToBinIndex(value, bandwidth);
        }

        function tickerXLabelFormatter(index, defaultFormatter) {
            const value = DSP.FFT.binIndexToFreq(index, bandwidth);
            if (value === maxFreq) {
                return "Hz";
            }
            return defaultFormatter(value);
        }

        const title = "Normalized average spectrum, " + Math.ceil(file.duration) + " frames";

        const options = {
            interaction: {
                trackMouse: false
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
                    log: true,
                    tickerValuePreFormatter: tickerXValuePreFormatter,
                    tickerValuePostFormatter: tickerXValuePostFormatter,
                    tickerLabelFormatter: tickerXLabelFormatter,
                    bounds: {
                        min: DSP.FFT.freqToBinIndex(20, bandwidth),
                        max: DSP.FFT.freqToBinIndex(maxFreq, bandwidth)
                    }
                },
                y: {
                    width: yWidth,
                    tickerLabelFormatter: tickerLabelFormatter.bind(null, -10, "dB"),
                    bounds: {
                        min: -90,
                        max: -10
                    }
                }
            }
        };

        return <Graph className="detailes-graph-avgspectrum" options={options} />;
    };

    const renderAllpass = () => {
        const maxFreq = file.allpass.freqs[file.allpass.freqs.length - 1];
        const dataY = [];
        const colors = [Static.getColor(0)];
        const dashed = [];
        file.channels.forEach((c, i) => {
            const color = Static.getColor(i + 1);
            dataY.push(c.allpass.map(Static.toDb));
            colors.push(color);
            dashed.push(false)
            dataY.push(new Array(c.allpass.length).fill(Static.toDb(c.crest)));
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
                    log: true,
                    tickerLabelFormatter: tickerLabelFormatter.bind(null, maxFreq, "Hz"),
                    bounds: {
                        min: file.allpass.freqs[0],
                        max: maxFreq
                    }
                },
                y: {
                    width: yWidth,
                    tickerLabelFormatter: tickerLabelFormatter.bind(null, 30, "dB"),
                    bounds: {
                        min: 0,
                        max: 30
                    }
                }
            }
        };

        return <Graph className="detailes-graph-allpass" options={options} />;
    };

    const renderHistogram = () => {
        const maxValueX = file.channels[0].histogram.graph.length / 2 - 1;
        const maxValueY = 50000;

        function valueToIndex(value) {
            return Math.round((value + 1) * maxValueX);
        }

        function indexToValue(index) {
            return index / maxValueX - 1;
        }

        function tickerXLabelFormatter(value, defaultFormatter) {
            return defaultFormatter(indexToValue(value));
        }

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
                tickLabels: {
                    width: 25
                },
                x: {
                    tickerValuePreFormatter: indexToValue,
                    tickerValuePostFormatter: valueToIndex,
                    tickerLabelFormatter: tickerXLabelFormatter,
                    bounds: {
                        min: valueToIndex(-1.1),
                        max: valueToIndex(1.1)
                    }
                },
                y: {
                    width: yWidth,
                    log: true,
                    tickerLabelFormatter: tickerLabelFormatter.bind(null, maxValueY, "n"),
                    bounds: {
                        min: 1,
                        max: maxValueY
                    }
                }
            }
        };

        return <Graph className="detailes-graph-histogram" options={options} />;
    };

    const renderPeakVsRms = () => {
        const options = {
            interaction: {
                trackMouse: false
            },
            title: Static.getTitle("Peak vs RMS level"),
            border: Static.getBorder(),
            graph: {
                lineWidth: 0,
                markerRadius: 3,
                dataX: file.channels.map(c => c.peakVsRms.rms),
                dataY: file.channels.map(c => c.peakVsRms.peak),
                colors: [
                    Static.getColor(0),
                    ...file.channels.map((c, i) => Static.getColor(i + 1))
                ]
            },
            axes: {
                x: {
                    tickerLabelFormatter: tickerLabelFormatter.bind(null, 0, "dBFS"),
                    numTicks: 6,
                    bounds: {
                        min: -50,
                        max: 0
                    }
                },
                y: {
                    width: yWidth,
                    numTicks: 6,
                    tickerLabelFormatter: tickerLabelFormatter.bind(null, 0, "dBFS"),
                    bounds: {
                        min: -50,
                        max: 0
                    }
                }
            }
        };

        return <Graph className="detailes-graph-peakvsrms" options={options} />;
    };

    const renderShortTermCrest = () => {
        const maxX = file.channels[0].peakVsRms.crest.length;
        const checksum = getChecksumString(file.checksum);
        const paddingLength = 29 - checksum.length;
        const padding = paddingLength > 1
            ? new Array(paddingLength).fill(" ").join("")
            : ". ";
        const title = `Short term (1s) crest factor${padding}Checksum(energy) ${checksum}`;
        const options = {
            interaction: {
                trackMouse: false
            },
            title: Static.getTitle(title),
            border: Static.getBorder(),
            graph: {
                lineWidth: 0,
                markerRadius: 3,
                dataY: file.channels.map(c => c.peakVsRms.crest),
                colors: [
                    Static.getColor(0),
                    ...file.channels.map((c, i) => Static.getColor(i + 1))
                ]
            },
            axes: {
                x: {
                    numTicks: 20,
                    tickerLabelFormatter: tickerLabelFormatter.bind(null, maxX, "s"),
                    bounds: {
                        min: 0,
                        max: maxX
                    }
                },
                y: {
                    width: yWidth,
                    tickerLabelFormatter: tickerLabelFormatter.bind(null, 30, "dB"),
                    bounds: {
                        min: 0,
                        max: 30
                    }
                }
            }
        };

        return <Graph className="detailes-graph-shortterm" options={options} />;
    }

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
                    {renderPeakVsRms()}
                </div>
                {renderShortTermCrest()}
            </React.Fragment>
        );
    }

    return (
        <div className="main" id="main-details">
            <h2 className="detailes-title">
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

const yWidth = 40;

function getChecksumString(checksum) {
    const str = checksum.toString();
    const parts = [];
    for (let i = str.length; i >= 0; i -= 3) {
        parts.push(str.substring(i - 3, i));
    }
    return parts.reverse().join(" ");
}

function tickerLabelFormatter(maxValue, maxLabel, value, defaultFormatter) {
    if (value === maxValue) {
        return maxLabel;
    }
    return defaultFormatter(value);
}