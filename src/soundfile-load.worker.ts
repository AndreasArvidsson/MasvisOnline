import { AV } from "./AV";
import { Timer } from "./Timer";
import type { LoadWorkerInput, LoadWorkerResult } from "./types";

onmessage = (e: MessageEvent<LoadWorkerInput>) => {
    const file = e.data.file;
    const timerKey = `${file.name} [1.1] Decode file to buffer`;

    Timer.start(timerKey);

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

        Timer.stop(timerKey);

        const result = parseBuffer({
            file,
            numChannels,
            sampleRate,
            bitDepth,
            duration,
            buffer,
        });

        // Add arrays buffers to the transfer list. Decreases message time.
        const transfers = result.channels.map((c) => c.graph.buffer);

        postMessage(result, "/", transfers);
    };

    asset.on("error", (error) => {
        throw error;
    });

    asset.on("format", (f) => {
        numChannels = f.channelsPerFrame;
        sampleRate = f.sampleRate;
        bitDepth = f.bitsPerChannel;
        checkIfLoaded();
    });

    asset.on("duration", (d) => {
        duration = Math.floor(d / 1000);
        checkIfLoaded();
    });

    asset.decodeToBuffer((b) => {
        buffer = b;
        checkIfLoaded();
    });
};

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
    Timer.start(timerKey);

    // Divide sampledata into channels and calculate channel stats.
    const channels = [];
    let sqrSum = 0;
    let peak = 0;
    const numSamples = buffer.length / numChannels;

    for (let c = 0; c < numChannels; ++c) {
        // Graph data for each channel.
        const graphData = new Float32Array(numSamples);
        // The sum of all squared values for each channel.
        let sqrSumC = 0;
        // Peak level for each channel.
        let peakC = 0;

        // Iterate each sample for this channel
        for (let s = c, i = -1; s < buffer.length; s += numChannels) {
            graphData[++i] = buffer[s];
            peakC = Math.max(peakC, Math.abs(buffer[s]));
            sqrSumC += buffer[s] ** 2;
        }

        // Calculate channels stats.
        const rms = Math.sqrt(sqrSumC / numSamples);
        channels[c] = {
            peak: peakC,
            rms,
            crest: peakC / rms,
            graph: graphData,
        };

        // For entire file:
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

    Timer.stop(timerKey);

    return result;
}
