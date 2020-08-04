import AV from "./AV";

const showTimer = true;

onmessage = (e) => {
    const file = e.data.file;

    if (showTimer) {
        console.time(file.name + " - decodeToBuffer");
    }

    const asset = AV.Asset.fromFile(file);
    const result = {};
    let buffer;
    let progress = 0;

    const checkIfLoaded = () => {
        if (progress === 3) {
            if (showTimer) {
                console.timeEnd(file.name + " - decodeToBuffer");
            }
            parseBuffer(result, buffer, file);
            //Add arrays buffers to the transfer list. Decreases message time.
            const transfers = result.channels.map(c => c.graph.buffer);
            postMessage(result, transfers);
        }
    };

    asset.on("error", err => {
        throw Error(err);
    });
    asset.on("format", f => {
        result.numChannels = f.channelsPerFrame;
        result.sampleRate = f.sampleRate;
        result.bitDepth = f.bitsPerChannel || 16;
        ++progress;
        checkIfLoaded();
    });
    asset.on("duration", d => {
        result.duration = Math.floor(d / 1000);
        ++progress;
        checkIfLoaded();
    });
    asset.decodeToBuffer(b => {
        buffer = b;
        ++progress;
        checkIfLoaded();
    });
};

function parseBuffer(res, buffer, file) {
    if (showTimer) {
        console.time(file.name + " - parseBuffer");
    }

    const numChannels = res.numChannels;
    res.numSamples = buffer.length / numChannels;

    //Divide sampledata into channels and calculate channel stats.
    const channels = [];
    let sqrSum = 0;
    let peak = 0;

    for (let c = 0; c < numChannels; ++c) {
        //The sum of all squared values for each channel.
        let sqrSumC = 0;
        //Graph data for each channel.
        const graphData = new Float32Array(res.numSamples);
        let peakMax = 0;
        let peakMin = 0;
        let i = -1;

        //Iterate each sample for this channel
        for (let s = c; s < buffer.length; s += numChannels) {
            const value = buffer[s];
            graphData[++i] = value;
            sqrSumC += value * value;

            //Optimized version of: peakC = Math.max(peakC, Math.abs(value))
            if (value > peakMax) {
                peakMax = value;
            }
            else if (value < peakMin) {
                peakMin = value;
            }
        }

        //Calculate channels stats.
        const peakC = Math.max(peakMax, Math.abs(peakMin));
        const rms = Math.sqrt(sqrSumC / res.numSamples);
        channels[c] = {
            peak: peakC,
            rms: rms,
            crest: peakC / rms,
            graph: graphData
        };

        //For entire file:
        sqrSum += sqrSumC;
        peak = Math.max(peak, peakC);
    }

    res.channels = channels;
    res.peak = peak;
    res.rms = Math.sqrt(sqrSum / (res.numSamples * res.numChannels));
    res.crest = res.peak / res.rms;

    if (showTimer) {
        console.timeEnd(file.name + " - parseBuffer");
    }
}