import Static from "./Static";
import DSP from "./DSP";

onmessage = (e) => {
    const data = e.data;
    const result = {
        channels: data.channels
    };
    calculateLoudestPart(data, result);
    calculateAvgSpectrum(data, result);
    calculateAllpass(data, result);
    const transfer = [];
    for (let i = 0; i < result.channels.length; ++i) {
        transfer.push(result.channels[i].graph.buffer);
        transfer.push(result.channels[i].avgSpectrum.buffer);
    }
    postMessage(result, transfer);
};

function calculateAvgSpectrum(data, result) {
    //Number of frames/seconds that are summed together.
    const numFrames = Math.ceil(data.numSamples / data.sampleRate);
    const bufferSize = DSP.FFT.calculatePow2Size(data.sampleRate);
    const outSize = bufferSize / 2;

    const blackman = DSP.windowFunctions.Blackman(data.sampleRate).getData();
    const fft = new DSP.FFT(bufferSize);

    for (let c = 0; c < result.channels.length; ++c) {
        const channel = result.channels[c];
        const graph = channel.graph;
        const seconds = new Float32Array(outSize);

        //Loop over each second and sum FFT components together.
        const length = graph.length;
        for (let s = 0; s < length;) {
            const max = Math.min(s + data.sampleRate, length);
            const second = new Float32Array(bufferSize);
            //1sec blackman window.
            for (let i = 0; s < max; ++s, ++i) {
                second[i] += graph[s] * blackman[i];
            }

            //FFT
            fft.fft(second);
            const real = fft.getReal();
            const imag = fft.getImaginary();

            for (let i = 0; i < outSize; ++i) {
                const realVal = real[i] / data.sampleRate;
                const imagVal = imag[i] / data.sampleRate;
                //Add square sum to total.
                seconds[i] += realVal * realVal + imagVal * imagVal;
            }
        }

        const rms = channel.rms;
        for (let i = 0; i < outSize; ++i) {
            //Convert real + imag to normalized dB spectrum.
            seconds[i] = 20 * Static.log10(Math.sqrt(seconds[i] / numFrames) / rms);
        }

        //Remove padded data above outSize.
        result.channels[c].avgSpectrum = seconds.subarray(0, outSize);
    }
}

function calculateLoudestPart(data, result) {
    //Loudest part treshold.
    const threshold = data.peak * 0.95;
    //Number of samples for a 20ms window.
    const windowSize = data.sampleRate * 0.02;
    let maxCount = 0;
    let loudestChannel, maxIndex;
    //Calculate loudest part per channel.
    for (let i = 0; i < result.channels.length; ++i) {
        const graph = result.channels[i].graph;
        let maxIndexC = 0;
        let maxCountC = 0;
        let start = 0;
        let end = -1;
        let count = 0;
        //Initialize window.
        let size = Math.min(windowSize, graph.length) - 1;
        while (end < size) {
            if (Math.abs(graph[++end]) > threshold) {
                ++count;
            }
        }
        maxIndexC = start;
        maxCountC = count;
        //Move window to end.
        size = graph.length - 1;
        while (end < size) {
            if (Math.abs(graph[start++]) > threshold) {
                --count;
            }
            if (Math.abs(graph[++end]) > threshold) {
                ++count;
            }
            //Update max count for channel.
            if (count > maxCountC) {
                maxCountC = count;
                maxIndexC = start;
            }
        }
        //Update max for track.
        if (maxCountC > maxCount) {
            maxCount = maxCountC;
            maxIndex = maxIndexC;
            loudestChannel = i;
        }
    }
    //Store loudest part in channel.
    result.channels[loudestChannel].loudestPart = {
        count: maxCount,
        index: maxIndex + windowSize / 2
    };
}

function calculateAllpass(data, result) {
    const freqs = [20, 60, 200, 600, 2000, 6000, 20000];
    const outBuffer = new Float32Array(data.numSamples);
    let maxCrest = 0;

    result.channels.forEach(channel => {
        const graph = channel.graph;
        channel.allpass = [];
        freqs.forEach(fc => {
            let sqrSum = 0;
            let peak = 0;

            const allpassFilter = new DSP.allpass(fc, data.sampleRate);
            allpassFilter.process(graph, outBuffer);
            for (let j = 0; j < outBuffer.length; ++j) {
                const value = outBuffer[j];
                sqrSum += value * value;
                peak = Math.max(peak, Math.abs(value));
            }

            const rms = Math.sqrt(sqrSum / data.numSamples)
            const crest = peak / rms;
            maxCrest = Math.max(maxCrest, crest);
            channel.allpass.push(crest);
        });
    });

    result.allpass = { freqs, maxCrest };
}