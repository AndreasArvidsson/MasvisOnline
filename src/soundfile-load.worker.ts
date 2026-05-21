import { AV } from "./AV";
import { Timer } from "./Timer";
import type { LoadWorkerInput, LoadWorkerResult } from "./types";

onmessage = (e: MessageEvent<LoadWorkerInput>) => {
    const file = e.data.file;

    const timerKey = `${file.name} [1.1] Decode file to buffer`;
    Timer.start(timerKey);

    const asset = AV.Asset.fromFile(file);
    const result: LoadWorkerResult = {};
    let buffer: Float32Array;
    let progress = 0;

    const checkIfLoaded = () => {
        if (progress === 3) {
            Timer.stop(timerKey);
            parseBuffer(result, buffer, file);
            // Add arrays buffers to the transfer list. Decreases message time.
            const transfers = result.channels.map((c) => c.graph.buffer);

            postMessage(result, "/", transfers);
        }
    };

    asset.on("error", (error) => {
        throw error;
    });
    asset.on("format", (f) => {
        result.numChannels = f.channelsPerFrame;
        result.sampleRate = f.sampleRate;
        result.bitDepth = f.bitsPerChannel ?? 16;
        ++progress;
        checkIfLoaded();
    });
    asset.on("duration", (d) => {
        result.duration = Math.floor(d / 1000);
        ++progress;
        checkIfLoaded();
    });
    asset.decodeToBuffer((b) => {
        buffer = b;
        ++progress;
        checkIfLoaded();
    });
};

function parseBuffer(res: LoadWorkerResult, buffer: Float32Array, file: File) {
    const timerKey = `${file.name} [1.2] Parse buffer`;
    Timer.start(timerKey);
    const numChannels = res.numChannels ?? 1;
    // Divide sampledata into channels and calculate channel stats.
    const channels = [];
    let sqrSum = 0;
    let peak = 0;
    res.numSamples = buffer.length / numChannels;

    for (let c = 0; c < numChannels; ++c) {
        // Graph data for each channel.
        const graphData = new Float32Array(res.numSamples);
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
        const rms = Math.sqrt(sqrSumC / res.numSamples);
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

    res.channels = channels;
    res.peak = peak;
    res.rms = Math.sqrt(sqrSum / (res.numSamples * numChannels));
    res.crest = res.peak / res.rms;

    Timer.stop(timerKey);
}
