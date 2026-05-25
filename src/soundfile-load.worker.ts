import type { LoadWorkerInput, LoadWorkerResult } from "./types";
import { AV } from "./util/AV";

const overviewGraphWidth = 645;

onmessage = (e: MessageEvent<LoadWorkerInput>) => {
    const file = e.data.file;
    const timerKey = `${file.name} [1.1] Decode file to buffer`;

    console.time(timerKey);

    const asset = AV.Asset.fromFile(file);
    let numChannels: number | undefined;
    let sampleRate: number | undefined;
    let bitDepth: number | undefined;
    let duration: number | undefined;
    let buffer: Float32Array | undefined;

    const checkIfLoaded = () => {
        if (
            numChannels == null ||
            sampleRate == null ||
            bitDepth == null ||
            duration == null ||
            buffer == null
        ) {
            return;
        }

        console.timeEnd(timerKey);

        const result = parseBuffer({
            file,
            numChannels,
            sampleRate,
            bitDepth,
            duration,
            buffer,
        });

        // Add arrays buffers to the transfer list. Decreases message time.
        const transfer: Transferable[] = result.channels.flatMap((c) => [
            c.graph.buffer,
            c.overviewGraph.buffer,
        ]);

        postMessage(result, { transfer });
    };

    asset.on("error", (error) => {
        postMessage({ error });
    });

    asset.on("format", (f: AudioFormat) => {
        numChannels = f.channelsPerFrame;
        sampleRate = f.sampleRate;
        // For example for mp3 files bitsPerChannel is not provided. Default to 16 bit depth like MasVis.exe.
        bitDepth = f.bitsPerChannel ?? 16;
        checkIfLoaded();
    });

    asset.on("duration", (d) => {
        duration = d;
        checkIfLoaded();
    });

    asset.decodeToBuffer((b) => {
        buffer = b;
        checkIfLoaded();
    });
};

interface AudioFormat {
    channelsPerFrame: number;
    sampleRate: number;
    bitsPerChannel?: number;
}

interface ParseProps {
    file: File;
    numChannels: number;
    sampleRate: number;
    bitDepth: number;
    duration: number;
    buffer: Float32Array;
}

function parseBuffer({
    file,
    numChannels,
    sampleRate,
    bitDepth,
    duration,
    buffer,
}: ParseProps): LoadWorkerResult {
    const timerKey = `${file.name} [1.2] Parse buffer`;
    console.time(timerKey);

    // Divide sampledata into channels and calculate channel stats.
    const channels = [];
    const numSamples = buffer.length / numChannels;
    let sqrSum = 0;
    let peak = 0;

    for (let c = 0; c < numChannels; ++c) {
        // Graph data for each channel.
        const graphData = new Float32Array(numSamples);
        // The sum of all squared values for each channel.
        let sqrSumC = 0;
        // Peak level for each channel.
        let peakC = 0;

        // Iterate each sample for this channel. NOTE: performance hot path.
        for (let s = c, i = -1; s < buffer.length; s += numChannels) {
            const sample = buffer[s];
            const absSample = Math.abs(sample);

            graphData[++i] = sample;
            sqrSumC += sample * sample;

            if (absSample > peakC) {
                peakC = absSample;
            }
        }

        // Clamp value to prevent issues with malformed files.
        peakC = Math.min(peakC, 1);

        // Calculate channels stats.
        const rms = Math.sqrt(sqrSumC / numSamples);
        channels[c] = {
            peak: peakC,
            rms,
            crest: peakC / rms,
            graph: graphData,
            overviewGraph: createOverviewGraph(graphData),
        };

        // Calculate stats for the entire file.
        sqrSum += sqrSumC;
        peak = Math.max(peak, peakC);
    }

    const rms = Math.sqrt(sqrSum / (numSamples * numChannels));
    const crest = peak / rms;

    const result: LoadWorkerResult = {
        numChannels,
        sampleRate,
        bitDepth,
        duration,
        numSamples,
        peak,
        rms,
        crest,
        channels,
    };

    console.timeEnd(timerKey);

    return result;
}

function createOverviewGraph(graph: Float32Array): Float32Array {
    if (graph.length <= overviewGraphWidth * 2) {
        return graph.slice();
    }

    const overviewGraph = new Float32Array(overviewGraphWidth * 2);
    const samplesPerPixel = graph.length / overviewGraphWidth;

    for (let i = 0; i < overviewGraphWidth; ++i) {
        const start = Math.floor(i * samplesPerPixel);
        const end = Math.min(
            graph.length,
            Math.floor((i + 1) * samplesPerPixel),
        );
        let min = graph[start];
        let max = graph[start];

        for (let i = start + 1; i < end; ++i) {
            const sample = graph[i];
            min = Math.min(min, sample);
            max = Math.max(max, sample);
        }

        overviewGraph[i * 2] = min;
        overviewGraph[i * 2 + 1] = max;
    }

    return overviewGraph;
}
