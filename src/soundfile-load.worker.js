onmessage = (e) => {
    const numChannels = e.data.format.channelsPerFrame;
    const buffer = e.data.buffer;
    const result = {
        numChannels,
        sampleRate: e.data.format.sampleRate,
        bitDepth: e.data.format.bitsPerChannel,
        numSamples: buffer.length / numChannels,
        duration: e.data.duration
    };

    const bufferLength = buffer.length;

    //Divide sampledata into channels and calculate channel stats.
    const channels = [];
    let sqrSum = 0;
    let peak = 0;

    for (let c = 0; c < numChannels; ++c) {
        //The sum of all squared values for each channel.
        let sqrSumC = 0;
        //The max/peak value for each channel.
        let peakC = 0;
        //Graph data for each channel.
        const graphData = new Float32Array(result.numSamples);
        let i = -1;
        //Iterate each sample for this channel
        for (let s = c; s < bufferLength; s += numChannels) {
            const value = buffer[s];
            graphData[++i] = value;
            sqrSumC += value * value;
            peakC = Math.max(peakC, Math.abs(value));
        }
        //Calculate channels stats.
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