import Static from "./Static";
import DSP from "./DSP";

const showTimer = true;

onmessage = (e) => {
    const data = e.data;
    const result = {
        channels: data.channels
    };
    calculateLoudestPart(data, result);
    calculateAvgSpectrum(data, result);
    calculateAllpass(data, result);
    calculateHistogram(data, result);
    const transfer = [];
    for (let i = 0; i < result.channels.length; ++i) {
        transfer.push(result.channels[i].graph.buffer);
        transfer.push(result.channels[i].avgSpectrum.buffer);
        transfer.push(result.channels[i].histogram.graph.buffer);
    }
    postMessage(result, transfer);
};

function calculateLoudestPart(data, result) {
    if (showTimer) {
        console.time("calculateLoudestPart");
    }
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
    if (showTimer) {
        console.timeEnd("calculateLoudestPart");
    }
}

function calculateAvgSpectrum(data, result) {
    if (showTimer) {
        console.time("calculateAvgSpectrum");
    }
    //Number of frames/seconds that are summed together.
    const numFrames = Math.ceil(data.numSamples / data.sampleRate);
    const bufferSize = DSP.FFT.calculatePow2Size(data.sampleRate);
    const outSize = bufferSize / 2;

    const blackman = DSP.windowFunctions.Blackman(data.sampleRate).getData();
    const fft = new DSP.FFT(bufferSize, data.sampleRate);
    const second = new Float32Array(bufferSize);

    result.channels.forEach(channel => {
        const graph = channel.graph;
        const res = new Float32Array(outSize);

        //Loop over each second and sum FFT components together.
        const length = graph.length;
        for (let i = 0; i < length;) {
            const max = Math.min(i + data.sampleRate, length);

            //1sec blackman window.
            let s = 0;
            for (; i < max; ++i, ++s) {
                second[s] = graph[i] * blackman[s];
            }
            //Fill rest of window with zeros.
            for (; s < bufferSize; ++s) {
                second[s] = 0;
            }

            //FFT
            fft.fft(second);
            const real = fft.getReal();
            const imag = fft.getImaginary();

            for (let j = 0; j < outSize; ++j) {
                //Add square sum to total.
                res[j] += real[j] * real[j] + imag[j] * imag[j];
            }
        }

        const rms = channel.rms;
        const div = data.sampleRate * data.sampleRate * numFrames;
        for (let i = 0; i < outSize; ++i) {
            //Convert square sum to normalized dB spectrum.
            res[i] = 20 * Static.log10(Math.sqrt(res[i] / div) / rms);
        }

        //Remove padded data above outSize.
        channel.avgSpectrum = res;
    });
    if (showTimer) {
        console.timeEnd("calculateAvgSpectrum");
    }
}

function calculateAllpass(data, result) {
    if (showTimer) {
        console.time("calculateAllpass");
    }
    const freqs = [20, 60, 200, 600, 2000, 6000, 20000];
    let maxCrest = 0;

    result.channels.forEach(channel => {
        channel.allpass = [];
        freqs.forEach(fc => {
            const graph = channel.graph;
            const allpassFilter = new DSP.allpass(fc, data.sampleRate);
            let sqrSum = 0;
            let peakMax = 0;
            let peakMin = 0;

            for (let i = 0; i < graph.length; ++i) {
                const value = allpassFilter.processSample(graph[i]);
                sqrSum += value * value;

                //Optimized version of: peak = Math.max(peak, Math.abs(value))
                if (value > peakMax) {
                    peakMax = value;
                }
                else if (value < peakMin) {
                    peakMin = value;
                }
            }

            const peak = Math.max(peakMax, Math.abs(peakMin));
            const rms = Math.sqrt(sqrSum / data.numSamples)
            const crest = peak / rms;
            maxCrest = Math.max(maxCrest, crest);
            channel.allpass.push(crest);
        });
    });

    result.allpass = { freqs, maxCrest };

    if (showTimer) {
        console.timeEnd("calculateAllpass");
    }
}

function calculateHistogram(data) {
    if (showTimer) {
        console.time("calculateHistogram");
    }
    const maxValue = Math.pow(2, data.bitDepth - 1) - 1;
    data.channels.forEach(channel => {
        const res = new Float32Array(Math.pow(2, data.bitDepth));
        const graph = channel.graph;
        for (let i = 0; i < graph.length; ++i) {
            ++res[
                Math.round((graph[i] + 1) * maxValue)
            ];
        }

        const used = {};
        let peak = 0;
        let count = 0;
        for (let i = 0; i < res.length; ++i) {
            if (res[i] && !used[i]) {
                used[i] = true;
                ++count;
                peak = Math.max(peak, res[i]);
            }
        }

        channel.histogram = {
            graph: res,
            bits: Math.log2(count),
            peak
        };
    });
    if (showTimer) {
        console.timeEnd("calculateHistogram");
    }
}