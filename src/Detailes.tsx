import Graph from "owp.graph-react";
import type { GraphOptions } from "owp.graph-react";
import "./Detailes.css";
import type { JSX } from "react";
import {
    binIndexToFreq,
    calculateBandwidth,
    calculatePow2Size,
    freqToBinIndex,
} from "./dsp/FFT";
import { IconLoading } from "./IconLoading";
import type { AnalysisFile, DetailedChannel, DetailedFile } from "./types";
import { getBorder } from "./util/getBorder";
import { getColor } from "./util/getColor";
import { getName } from "./util/getName";
import { getTitle } from "./util/getTitle";
import { round } from "./util/round";
import { tickerLabelformatterTime } from "./util/tickerLabelformatterTime";
import { tickerValuePostFormatter } from "./util/tickerValuePostFormatter";
import { tickerValuePreFormatter } from "./util/tickerValuePreFormatter";
import { toDb } from "./util/toDb";
import { VersionTag } from "./VersionTag";

interface DetailesProps {
    file: AnalysisFile;
}

export function Detailes({ file }: DetailesProps): JSX.Element {
    return (
        <div id="main-details">
            <h2 className="detailes-title">{file.file.name}</h2>

            {file.type === "detailed" ? (
                <>
                    <DetailedGraphs file={file} />
                    <VersionTag />
                </>
            ) : (
                <div className="fs-5 text-center">
                    <IconLoading /> Loading...
                </div>
            )}
        </div>
    );
}

function DetailedGraphs({ file }: { file: DetailedFile }): JSX.Element {
    const renderChannel = (channel: DetailedChannel, i: number) => {
        const crest = toDb(channel.crest, 2);
        const rms = toDb(channel.rms, 2);
        const peak = toDb(channel.peak, 2);
        const title = `${getName(i + 1)}: Crest=${crest} dB, RMS=${rms} dBFS, Peak=${peak} dBFS`;

        const options: GraphOptions = {
            interaction: {
                trackMouse: false,
            },
            title: getTitle(title),
            border: getBorder(),
            graph: {
                dataY: [channel.graph],
                colors: [getColor(0), getColor(i + 1)],
            },
            axes: {
                x: {
                    numTicks: 20,
                    tickerValuePreFormatter: tickerValuePreFormatter.bind(
                        null,
                        file.sampleRate,
                    ),
                    tickerValuePostFormatter: tickerValuePostFormatter.bind(
                        null,
                        file.sampleRate,
                    ),
                    tickerLabelFormatter: tickerLabelformatterTime.bind(
                        null,
                        file.sampleRate,
                    ),
                    bounds: {
                        min: 0,
                        max: file.numSamples,
                    },
                },
                y: {
                    width: yWidth,
                    bounds: {
                        min: -1,
                        max: 1,
                    },
                },
            },
            highlight: {
                xMin: null,
                xMax: null,
                yMin: null,
                yMax: null,
                color: "rgba(0,0,0,0.5)",
            },
        };

        if (channel.loudestPart != null) {
            const minOffset = Math.round(file.numSamples * 0.0004);
            const loudestPartOffset = file.sampleRate * 0.05;
            // Use a min offset so that the hightlight isn't to small.
            const offset = Math.max(minOffset, loudestPartOffset);
            const minIndex = Math.max(0, channel.loudestPart.index - offset);
            const maxIndex = minIndex + 2 * offset;
            options.highlight = {
                ...options.highlight,
                xMin: minIndex,
                xMax: maxIndex,
            };
        }

        return (
            <Graph
                key={i}
                className="detailes-graph-channel"
                options={options}
            />
        );
    };

    const renderLoudestPart = () => {
        const i = file.channels.findIndex((c) => c.loudestPart != null);
        const channel = file.channels[i];
        const loudestPart = channel.loudestPart;
        if (loudestPart == null) {
            return null;
        }
        const name = getName(i + 1);
        const time = round(loudestPart.index / file.sampleRate, 2);
        const count = loudestPart.count;
        const title = `Loudest part (${name} ch, ${count} samples >95% during 20ms at ${time}s)`;
        // Number of samples for 50ms.
        const offset = file.sampleRate * 0.05;
        const minIndex = Math.max(0, loudestPart.index - offset);
        const maxIndex = minIndex + 2 * offset;

        const options = {
            interaction: {
                trackMouse: false,
            },
            title: getTitle(title),
            border: getBorder(),
            graph: {
                dataY: [channel.graph],
                colors: [getColor(0), getColor(i + 1)],
            },
            axes: {
                x: {
                    numTicks: 20,
                    tickerValuePreFormatter: tickerValuePreFormatter.bind(
                        null,
                        file.sampleRate,
                    ),
                    tickerValuePostFormatter: tickerValuePostFormatter.bind(
                        null,
                        file.sampleRate,
                    ),
                    tickerLabelFormatter: tickerLabelformatterTime.bind(
                        null,
                        file.sampleRate,
                    ),
                    bounds: {
                        min: minIndex,
                        max: maxIndex,
                    },
                },
                y: {
                    width: yWidth,
                    bounds: {
                        min: -1,
                        max: 1,
                    },
                },
            },
        };

        return <Graph className="detailes-graph-channel" options={options} />;
    };

    const renderAvgSpectrum = () => {
        const bufferSize = calculatePow2Size(file.sampleRate);
        const bandwidth = calculateBandwidth(bufferSize, file.sampleRate);
        const maxFreq = 20_000;

        function tickerXValuePreFormatter(value: number) {
            return binIndexToFreq(value, bandwidth);
        }

        function tickerXValuePostFormatter(value: number) {
            return freqToBinIndex(value, bandwidth);
        }

        function tickerXLabelFormatter(
            index: number,
            defaultFormatter: (value: number) => string,
        ) {
            const value = binIndexToFreq(index, bandwidth);
            if (value === maxFreq) {
                return "Hz";
            }
            return defaultFormatter(value);
        }

        const title = `Normalized average spectrum, ${Math.ceil(
            file.duration,
        )} frames`;

        const options: GraphOptions = {
            interaction: {
                trackMouse: false,
            },
            title: getTitle(title),
            border: getBorder(),
            graph: {
                simplify: 1,
                simplifyBy: "max",
                dataY: file.channels.map((c) => c.avgSpectrum),
                colors: [
                    getColor(0),
                    ...file.channels.map((c, i) => getColor(i + 1)),
                ],
            },
            axes: {
                x: {
                    log: true,
                    tickerValuePreFormatter: tickerXValuePreFormatter,
                    tickerValuePostFormatter: tickerXValuePostFormatter,
                    tickerLabelFormatter: tickerXLabelFormatter,
                    bounds: {
                        min: freqToBinIndex(20, bandwidth),
                        max: freqToBinIndex(maxFreq, bandwidth),
                    },
                },
                y: {
                    width: yWidth,
                    tickerLabelFormatter: tickerLabelFormatter.bind(
                        null,
                        -10,
                        "dB",
                    ),
                    bounds: {
                        min: -90,
                        max: -10,
                    },
                },
            },
        };

        return (
            <Graph className="detailes-graph-avgspectrum" options={options} />
        );
    };

    const renderAllpass = () => {
        const maxFreq = file.allpass.freqs[file.allpass.freqs.length - 1];
        const dataY: number[][] = [];
        const colors: string[] = [getColor(0)];
        const dashed: boolean[] = [];

        for (let i = 0; i < file.channels.length; ++i) {
            const c = file.channels[i];
            const color = getColor(i + 1);
            dataY.push(c.allpass.map(toDb));
            colors.push(color);
            dashed.push(false);
            // oxlint-disable-next-line unicorn/no-new-array
            dataY.push(new Array<number>(c.allpass.length).fill(toDb(c.crest)));
            colors.push(color);
            dashed.push(true);
        }

        const options: GraphOptions = {
            interaction: {
                trackMouse: false,
            },
            title: getTitle("Allpassed crest factor"),
            border: getBorder(),
            graph: {
                dataX: [file.allpass.freqs],
                dataY,
                colors,
                dashed,
            },
            axes: {
                x: {
                    log: true,
                    tickerLabelFormatter: tickerLabelFormatter.bind(
                        null,
                        maxFreq,
                        "Hz",
                    ),
                    bounds: {
                        min: file.allpass.freqs[0],
                        max: maxFreq,
                    },
                },
                y: {
                    width: yWidth,
                    tickerLabelFormatter: tickerLabelFormatter.bind(
                        null,
                        30,
                        "dB",
                    ),
                    bounds: {
                        min: 0,
                        max: 30,
                    },
                },
            },
        };

        return <Graph className="detailes-graph-allpass" options={options} />;
    };

    const renderHistogram = () => {
        const maxValueX = file.channels[0].histogram.graph.length / 2 - 1;
        const maxValueY = 50_000;

        function valueToIndex(value: number) {
            return Math.round((value + 1) * maxValueX);
        }

        function indexToValue(index: number) {
            return index / maxValueX - 1;
        }

        function tickerXLabelFormatter(
            value: number,
            defaultFormatter: (value: number) => string,
        ) {
            return defaultFormatter(indexToValue(value));
        }

        const bits = file.channels.map((c) => round(c.histogram.bits, 1));
        const options: GraphOptions = {
            interaction: {
                trackMouse: false,
            },
            title: getTitle(`Histogram, "bits": ${bits.join("/")}`),
            border: getBorder(),
            graph: {
                simplify: 1,
                simplifyBy: "max",
                dataY: file.channels.map((c) => c.histogram.graph),
                colors: [
                    getColor(0),
                    ...file.channels.map((c, i) => getColor(i + 1)),
                ],
            },
            axes: {
                tickLabels: {
                    width: 25,
                },
                x: {
                    tickerValuePreFormatter: indexToValue,
                    tickerValuePostFormatter: valueToIndex,
                    tickerLabelFormatter: tickerXLabelFormatter,
                    bounds: {
                        min: valueToIndex(-1.1),
                        max: valueToIndex(1.1),
                    },
                },
                y: {
                    width: yWidth,
                    log: true,
                    tickerLabelFormatter: tickerLabelFormatter.bind(
                        null,
                        maxValueY,
                        "n",
                    ),
                    bounds: {
                        min: 1,
                        max: maxValueY,
                    },
                },
            },
        };

        return <Graph className="detailes-graph-histogram" options={options} />;
    };

    const renderPeakVsRms = () => {
        const options = {
            interaction: {
                trackMouse: false,
            },
            title: getTitle("Peak vs RMS level"),
            border: getBorder(),
            graph: {
                lineWidth: 0,
                markerRadius: 3,
                dataX: file.channels.map((c) => c.peakVsRms.rms),
                dataY: file.channels.map((c) => c.peakVsRms.peak),
                colors: [
                    getColor(0),
                    ...file.channels.map((c, i) => getColor(i + 1)),
                ],
            },
            axes: {
                x: {
                    tickerLabelFormatter: tickerLabelFormatter.bind(
                        null,
                        0,
                        "dBFS",
                    ),
                    numTicks: 6,
                    bounds: {
                        min: -50,
                        max: 0,
                    },
                },
                y: {
                    width: yWidth,
                    numTicks: 6,
                    tickerLabelFormatter: tickerLabelFormatter.bind(
                        null,
                        0,
                        "dBFS",
                    ),
                    bounds: {
                        min: -50,
                        max: 0,
                    },
                },
            },
        };

        return <Graph className="detailes-graph-peakvsrms" options={options} />;
    };

    const renderShortTermCrest = () => {
        const maxX = file.channels[0].peakVsRms.crest.length;
        const checksum = getChecksumString(file.checksum);
        const paddingLength = 29 - checksum.length;
        const padding = paddingLength > 1 ? " ".repeat(paddingLength) : ". ";
        const title = `Short term (1s) crest factor${padding}Checksum(energy) ${checksum}`;
        const options = {
            interaction: {
                trackMouse: false,
            },
            title: getTitle(title),
            border: getBorder(),
            graph: {
                lineWidth: 0,
                markerRadius: 3,
                dataY: file.channels.map((c) => c.peakVsRms.crest),
                colors: [
                    getColor(0),
                    ...file.channels.map((c, i) => getColor(i + 1)),
                ],
            },
            axes: {
                x: {
                    numTicks: 20,
                    tickerLabelFormatter: tickerLabelFormatter.bind(
                        null,
                        maxX,
                        "s",
                    ),
                    bounds: {
                        min: 0,
                        max: maxX,
                    },
                },
                y: {
                    width: yWidth,
                    tickerLabelFormatter: tickerLabelFormatter.bind(
                        null,
                        30,
                        "dB",
                    ),
                    bounds: {
                        min: 0,
                        max: 30,
                    },
                },
            },
        };

        return <Graph className="detailes-graph-shortterm" options={options} />;
    };

    return (
        <>
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
        </>
    );
}

const yWidth = 40;

function getChecksumString(checksum: number) {
    const str = checksum.toString();
    const parts = [];
    for (let i = str.length; i >= 0; i -= 3) {
        parts.push(str.slice(i - 3, i));
    }
    return parts.toReversed().join(" ");
}

function tickerLabelFormatter(
    maxValue: number,
    maxLabel: string,
    value: number,
    defaultFormatter: (value: number) => string,
) {
    if (value === maxValue) {
        return maxLabel;
    }
    return defaultFormatter(value);
}
