import { allpass } from "./dsp/allpass";
import { calculatePow2Size, FFT } from "./dsp/FFT";
import { blackmanWindow } from "./dsp/WindowFunction";
import type {
    DetailedWorkerInput,
    DetailedWorkerResult,
    Histogram,
    LoudestPart,
    PeakVsRms,
} from "./types/types";
import { toDb } from "./util/util";

onmessage = (e: MessageEvent<DetailedWorkerInput>) => {
    const data = e.data;
    const loudestPart = calculateLoudestPart(data);
    const avgSpectrum = calculateAvgSpectrum(data);
    const allpass = calculateAllpass(data);
    const histogram = calculateHistogram(data);
    const peakVsRms = calculatePeakVsRms(data);

    const result: DetailedWorkerResult = {
        checksum: peakVsRms.checksum,
        allpass: {
            freqs: allpass.freqs,
        },
        channels: data.channels.map((channel, i) => {
            return {
                ...channel,
                loudestPart:
                    loudestPart.channel === i
                        ? loudestPart.loudestPart
                        : undefined,
                avgSpectrum: avgSpectrum[i],
                allpass: allpass.channels[i],
                histogram: histogram[i],
                peakVsRms: peakVsRms.channels[i],
            };
        }),
    };

    const transfer: Transferable[] = [];

    for (const channel of result.channels) {
        transfer.push(channel.graph.buffer);
        transfer.push(channel.avgSpectrum.buffer);
        transfer.push(channel.histogram.graph.buffer);
        transfer.push(channel.peakVsRms.peak.buffer);
        transfer.push(channel.peakVsRms.rms.buffer);
        transfer.push(channel.peakVsRms.crest.buffer);
    }

    postMessage(result, { transfer });
};

function calculateLoudestPart(data: DetailedWorkerInput): {
    channel: number;
    loudestPart: LoudestPart;
} {
    const timerKey = `${data.filename} [2.1] Calculate loudest part`;
    console.time(timerKey);
    // Loudest part threshold.
    const threshold = data.peak * 0.95;
    // Number of samples for a 20ms window.
    const windowSize = data.sampleRate * 0.02;
    let maxCount = 0;
    let loudestChannel = 0;
    let maxIndex = 0;

    // Calculate loudest part per channel.
    for (let i = 0; i < data.channels.length; ++i) {
        const graph = data.channels[i].graph;
        let start = 0;
        let end = -1;
        let count = 0;

        // Initialize window.
        let size = Math.min(windowSize, graph.length) - 1;
        while (end < size) {
            if (Math.abs(graph[++end]) > threshold) {
                ++count;
            }
        }

        // Move window to end.
        let maxIndexC = start;
        let maxCountC = count;
        size = graph.length - 1;

        while (end < size) {
            // Oldest sample(now to be removed) was above threshold. Decrease count.
            if (Math.abs(graph[start++]) > threshold) {
                --count;
            }
            // New sample is above threshold. Increase count.
            if (Math.abs(graph[++end]) > threshold) {
                ++count;
            }
            // Update max count for channel.
            if (count > maxCountC) {
                maxCountC = count;
                maxIndexC = start;
            }
        }

        // Update max for track.
        if (maxCountC > maxCount) {
            maxCount = maxCountC;
            maxIndex = maxIndexC;
            loudestChannel = i;
        }
    }

    console.timeEnd(timerKey);

    return {
        channel: loudestChannel,
        loudestPart: {
            count: maxCount,
            index: maxIndex + windowSize / 2,
        },
    };
}

function calculateAvgSpectrum(data: DetailedWorkerInput): Float32Array[] {
    const timerKey = `${data.filename} [2.2] Calculate avg spectrum`;
    console.time(timerKey);
    const bufferSize = calculatePow2Size(data.sampleRate);
    const blackman = blackmanWindow(data.sampleRate).getData();
    const fft = new FFT(bufferSize, data.sampleRate);
    const second = new Float32Array(bufferSize);
    // Number of frames/seconds that are summed together.
    const outSize = bufferSize / 2;
    const result: Float32Array[] = [];

    for (const channel of data.channels) {
        const graph = channel.graph;
        const rms = channel.rms;
        const res = new Float32Array(outSize);

        // Loop over each second and sum FFT components together.
        const length = graph.length;
        for (let i = 0; i < length; ) {
            // 1sec blackman window.
            const maxIndex = Math.min(i + data.sampleRate, length);
            let s = 0;
            for (; i < maxIndex; ++i, ++s) {
                second[s] = graph[i] * blackman[s];
            }
            // Fill rest of window with zeros.
            for (; s < bufferSize; ++s) {
                second[s] = 0;
            }

            // FFT
            fft.fft(second);
            const real = fft.getReal();
            const imag = fft.getImaginary();

            for (let j = 0; j < outSize; ++j) {
                // Add square sum to total.
                res[j] += real[j] * real[j] + imag[j] * imag[j];
            }
        }

        // Convert square sum to normalized dB spectrum.
        const div = data.sampleRate * length;
        for (let i = 0; i < outSize; ++i) {
            res[i] = toDb(Math.sqrt(res[i] / div) / rms);
        }

        result.push(res);
    }

    console.timeEnd(timerKey);

    return result;
}

function calculateAllpass(data: DetailedWorkerInput): {
    channels: number[][];
    freqs: number[];
} {
    const timerKey = `${data.filename} [2.3] Calculate allpass`;
    console.time(timerKey);
    const freqs = [20, 60, 200, 600, 2000, 6000, 20_000];
    const result: number[][] = [];

    for (const channel of data.channels) {
        const graph = channel.graph;
        const res: number[] = [];

        for (const fc of freqs) {
            const allpassFilter = allpass(fc, data.sampleRate);
            let peak = 0;
            let sqrSum = 0;

            for (const sample of graph) {
                const value = allpassFilter.processSample(sample);
                peak = Math.max(peak, Math.abs(value));
                sqrSum += value ** 2;
            }

            const rms = Math.sqrt(sqrSum / data.numSamples);
            res.push(peak / rms);
        }

        result.push(res);
    }

    console.timeEnd(timerKey);

    return { channels: result, freqs };
}

function calculateHistogram(data: DetailedWorkerInput): Histogram[] {
    const timerKey = `${data.filename} [2.4] Calculate histogram`;
    console.time(timerKey);
    const maxValue = 2 ** (data.bitDepth - 1) - 1;
    // Normalize all bit depth to 16bits.
    const numValues = 2 ** 16;
    const maxValueIndex = numValues / 2 - 1;
    // Normalize all sampling frequencies to 44100Hz.
    const sampleRateRatio = 44_100 / data.sampleRate;
    const result: Histogram[] = [];

    for (const channel of data.channels) {
        const graph = channel.graph;
        const res = new Float32Array(numValues);
        const used: Record<number, boolean> = {};
        let count = 0;

        for (const sample of graph) {
            const v = Math.round((sample + 1) * maxValue);
            if (!used[v]) {
                used[v] = true;
                ++count;
            }
            res[Math.round((sample + 1) * maxValueIndex)] += sampleRateRatio;
        }

        result.push({
            graph: res,
            bits: Math.log2(count),
        });
    }

    console.timeEnd(timerKey);

    return result;
}

function calculatePeakVsRms(data: DetailedWorkerInput): {
    channels: PeakVsRms[];
    checksum: number;
} {
    const timerKey = `${data.filename} [2.5] Calculate peak vs RMS`;
    console.time(timerKey);
    const maxValue = 2 ** (data.bitDepth - 1) - 1;
    const maxValueNeg = -(2 ** (data.bitDepth - 1));
    let checksum = 0;
    const result: PeakVsRms[] = [];

    for (const channel of data.channels) {
        const graph = channel.graph;
        const numFrames = Math.ceil(data.numSamples / data.sampleRate);
        const peakRes = new Float32Array(numFrames);
        const rmsRes = new Float32Array(numFrames);
        const crestRes = new Float32Array(numFrames);
        const length = graph.length;

        // Loop over each second and calculate rms and peak.
        for (let s = 0, i = 0; i < length; ++s) {
            const numSamples = Math.min(data.sampleRate, length - i);
            const maxIndex = i + numSamples;
            let peak = 0;
            let sqrSum = 0;

            // 1 sec window
            for (; i < maxIndex; ++i) {
                peak = Math.max(peak, Math.abs(graph[i]));
                sqrSum += graph[i] ** 2;
                checksum +=
                    Math.ceil(
                        graph[i] * (graph[i] < 0 ? maxValueNeg : maxValue),
                    ) ** 2;
            }

            const rms = Math.sqrt(sqrSum / numSamples);
            peakRes[s] = toDb(peak);
            rmsRes[s] = toDb(rms);
            crestRes[s] = toDb(peak / rms);
        }

        result.push({ peak: peakRes, rms: rmsRes, crest: crestRes });
    }

    console.timeEnd(timerKey);

    return { channels: result, checksum };
}
