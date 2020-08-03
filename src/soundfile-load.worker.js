onmessage = (e) => {
    const numChannels = e.data.format.channelsPerFrame;
    const result = {
        numChannels,
        sampleRate: e.data.format.sampleRate,
        bitDepth: e.data.format.bitsPerChannel || 16,
        numSamples: e.data.buffer.length / numChannels,
        duration: e.data.duration
    };

    //Divide sampledata into channels and calculate channel stats.
    const channels = [];
    let sqrSum = 0;
    let peak = 0;

    for (let c = 0; c < numChannels; ++c) {
        const buffer = e.data.buffer;
        //The sum of all squared values for each channel.
        let sqrSumC = 0;
        //Graph data for each channel.
        const graphData = new Float32Array(result.numSamples);
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
        const rms = Math.sqrt(sqrSumC / result.numSamples);
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

    result.channels = channels;
    result.peak = peak;
    result.rms = Math.sqrt(sqrSum / (result.numSamples * result.numChannels));
    result.crest = result.peak / result.rms;

    //Add arrays buffers to the transfer list. Decreases message time.
    const transfers = channels.map(c => c.graph.buffer);

    postMessage(result, transfers);
};