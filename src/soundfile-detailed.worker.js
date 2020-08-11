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
    calculatePeakVsRms(data, result);
    const transfer = [];
    result.channels.forEach(channel => {
        transfer.push(channel.graph.buffer);
        transfer.push(channel.avgSpectrum.buffer);
        transfer.push(channel.histogram.graph.buffer);
        transfer.push(channel.peakVsRms.peak.buffer);
        transfer.push(channel.peakVsRms.rms.buffer);
        transfer.push(channel.peakVsRms.crest.buffer);
    });
    postMessage(result, transfer);
};

function calculateLoudestPart(data, result) {
    if (showTimer) {
        console.time("calculateLoudestPart");
    }
    const min = Math.min;
    const abs = Math.abs;
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
        let size = min(windowSize, graph.length) - 1;
        while (end < size) {
            if (abs(graph[++end]) > threshold) {
                ++count;
            }
        }

        //Move window to end.
        maxIndexC = start;
        maxCountC = count;
        size = graph.length - 1;
        while (end < size) {
            //Oldest sample(now to be removed) was above threshold. Decrease count.
            if (abs(graph[start++]) > threshold) {
                --count;
            }
            //New sample is above threshold. Increase count.
            if (abs(graph[++end]) > threshold) {
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
    const sqrt = Math.sqrt;
    const min = Math.min;
    const toDb = Static.toDb;
    const bufferSize = DSP.FFT.calculatePow2Size(data.sampleRate);
    const blackman = DSP.windowFunctions.Blackman(data.sampleRate).getData();
    const fft = new DSP.FFT(bufferSize, data.sampleRate);
    const second = new Float32Array(bufferSize);
    //Number of frames/seconds that are summed together.
    const outSize = bufferSize / 2;

    result.channels.forEach(channel => {
        const graph = channel.graph;
        const rms = channel.rms;
        const res = new Float32Array(outSize);

        //Loop over each second and sum FFT components together.
        const length = graph.length;
        for (let i = 0; i < length;) {
            //1sec blackman window.
            const maxIndex = min(i + data.sampleRate, length);
            let s = 0;
            for (; i < maxIndex; ++i, ++s) {
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

        //Convert square sum to normalized dB spectrum.
        const div = data.sampleRate * length;
        for (let i = 0; i < outSize; ++i) {
            res[i] = toDb(sqrt(res[i] / div) / rms);
        }

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
    const max = Math.max;
    const sqrt = Math.sqrt;
    const abs = Math.abs;
    const pow = Math.pow;
    const freqs = [20, 60, 200, 600, 2000, 6000, 20000];

    result.channels.forEach(channel => {
        const graph = channel.graph;
        const res = [];

        freqs.forEach(fc => {
            const allpassFilter = new DSP.allpass(fc, data.sampleRate);
            let sqrSum = 0;
            let peak = 0;

            for (let i = 0; i < graph.length; ++i) {
                const value = allpassFilter.processSample(graph[i]);
                sqrSum += pow(value, 2);
                peak = max(peak, abs(value));
            }

            const rms = sqrt(sqrSum / data.numSamples)
            res.push(peak / rms);
        });

        channel.allpass = res;
    });

    result.allpass = { freqs };

    if (showTimer) {
        console.timeEnd("calculateAllpass");
    }
}

function calculateHistogram(data) {
    if (showTimer) {
        console.time("calculateHistogram");
    }
    const pow = Math.pow;
    const round = Math.round;
    const log2 = Math.log2;
    const maxValue = pow(2, data.bitDepth - 1) - 1;
    //Normalize all bit depth to 16bits.
    const numValues = pow(2, 16);
    const maxValueIndex = numValues / 2 - 1;
    //Normalize all sampling frequencies to 44100Hz.
    const sampleRateRatio = 44100 / data.sampleRate;

    data.channels.forEach(channel => {
        const graph = channel.graph;
        const res = new Float32Array(numValues);
        const used = {};
        let count = 0;

        for (let i = 0; i < graph.length; ++i) {
            const v = round((graph[i] + 1) * maxValue);
            if (!used[v]) {
                used[v] = true;
                ++count;
            }
            res[round((graph[i] + 1) * maxValueIndex)] += sampleRateRatio;
        }

        channel.histogram = {
            graph: res,
            bits: log2(count)
        };
    });

    if (showTimer) {
        console.timeEnd("calculateHistogram");
    }
}

function calculatePeakVsRms(data, result) {
    if (showTimer) {
        console.time("calculatePeakVsRms");
    }
    const min = Math.min;
    const ceil = Math.ceil;
    const max = Math.max;
    const abs = Math.abs;
    const sqrt = Math.sqrt;
    const pow = Math.pow;
    const toDb = Static.toDb;
    let checksum = 0;
    const maxValue = Math.pow(2, data.bitDepth - 1) - 1;
    const maxValueNeg = -Math.pow(2, data.bitDepth - 1);

    result.channels.forEach(channel => {
        const graph = channel.graph;
        const numFrames = ceil(data.numSamples / data.sampleRate);
        const rmsRes = new Float32Array(numFrames);
        const peakRes = new Float32Array(numFrames);
        const crestRes = new Float32Array(numFrames);
        const length = graph.length;
        let s = 0;

        //Loop over each second and calculate rms and peak.
        for (let i = 0; i < length; ++s) {
            const numSamples = min(data.sampleRate, length - i);
            const maxIndex = i + numSamples;
            let sqrSum = 0;
            let peak = 0;

            //1sec window
            for (; i < maxIndex; ++i) {
                const value = graph[i];
                sqrSum += pow(value, 2);
                peak = max(peak, abs(value));
                checksum += pow(ceil(value * (value < 0 ? maxValueNeg : maxValue)), 2);
            }

            const rms = sqrt(sqrSum / numSamples);
            rmsRes[s] = toDb(rms);
            peakRes[s] = toDb(peak);
            crestRes[s] = toDb(peak / rms);
        }

        channel.peakVsRms = { peak: peakRes, rms: rmsRes, crest: crestRes };
    });

    result.checksum = checksum;

    if (showTimer) {
        console.timeEnd("calculatePeakVsRms");
    }
}