
const DSP = {};

/* FFT */

function FFT(bufferSize, sampleRate) {
    //New was omitted.
    if (!(this instanceof FFT)) {
        return new FFT(bufferSize);
    }

    const bitDepth = Math.floor(Math.log(bufferSize) / Math.LN2);
    if (Math.pow(2, bitDepth) !== bufferSize) {
        console.error("Invalid buffer size, must be a power of 2.");
        return;
    }

    this._bufferSize = bufferSize;
    this._bandwidth = FFT.calculateBandwidth(bufferSize, sampleRate);

    const cosTable = new Float32Array(bufferSize / 2);
    const sinTable = new Float32Array(bufferSize / 2);
    for (let i = 0; i < bufferSize / 2; i++) {
        cosTable[i] = Math.cos(2 * Math.PI * i / bufferSize);
        sinTable[i] = Math.sin(2 * Math.PI * i / bufferSize);
    }
    this._cosTable = cosTable;
    this._sinTable = sinTable;
    this._real = new Float32Array(bufferSize);
    this._imag = new Float32Array(bufferSize);

    //Create reverse table.
    const reverseTable = new Uint32Array(bufferSize);
    let limit = 1;
    let bit = bufferSize >> 1;
    let i;
    while (limit < bufferSize) {
        for (i = 0; i < limit; i++) {
            reverseTable[i + limit] = reverseTable[i] + bit;
        }
        limit = limit << 1;
        bit = bit >> 1;
    }
    this._reverseTable = reverseTable;
}

FFT.prototype.fft = function (buffer) {
    if (buffer.length !== this._bufferSize) {
        console.error("Given buffer has size other than expected. Expected: " + this._bufferSize + " found: " + buffer.length);
        return;
    }
    const bufferSize = this._bufferSize;
    const cosTable = this._cosTable;
    const sinTable = this._sinTable;
    const reverseTable = this._reverseTable;
    const real = this._real;
    const imag = this._imag;

    //Apply reverse table.
    for (let i = 0; i < bufferSize; ++i) {
        real[i] = buffer[reverseTable[i]];
        imag[i] = 0;
    }

    //Cooley-Tukey decimation-in-time radix-2 FFT
    for (let size = 2; size <= bufferSize; size *= 2) {
        const halfsize = size / 2;
        const tablestep = bufferSize / size;
        for (let i = 0; i < bufferSize; i += size) {
            for (let j = i, k = 0; j < i + halfsize; ++j, k += tablestep) {
                const tpre = real[j + halfsize] * cosTable[k] + imag[j + halfsize] * sinTable[k];
                const tpim = -real[j + halfsize] * sinTable[k] + imag[j + halfsize] * cosTable[k];
                real[j + halfsize] = real[j] - tpre;
                imag[j + halfsize] = imag[j] - tpim;
                real[j] += tpre;
                imag[j] += tpim;
            }
        }
    }
};

FFT.prototype.getReal = function () {
    return this._real;
};

FFT.prototype.getImaginary = function () {
    return this._imag;
};

FFT.prototype.getBandFrequency = function (index) {
    return this._bandwidth * index + this._bandwidth / 2;
};

FFT.prototype.calculateSpectrum = function (outBuffer) {
    const size = this._bufferSize / 2;
    if (!outBuffer) {
        outBuffer = new Float32Array(size);
    }
    const mult = 1 / this._bufferSize;
    const real = this._real;
    const imag = this._imag;
    const sqrt = Math.sqrt;
    for (let i = 0; i < size; ++i) {
        outBuffer[i] = mult * sqrt(real[i] * real[i] + imag[i] * imag[i]);
    }
    return outBuffer;
};

FFT.prototype.calculateSpectrumDb = function (outBuffer) {
    const size = this._bufferSize / 2;
    if (!outBuffer) {
        outBuffer = new Float32Array(size);
    }
    const mult = 1 / this._bufferSize;
    const real = this._real;
    const imag = this._imag;
    const sqrt = Math.sqrt;
    const log = (x) => Math.log(x) / Math.LN10;
    for (let i = 0; i < size; ++i) {
        outBuffer[i] = 20 * log(mult * sqrt(real[i] * real[i] + imag[i] * imag[i]));
    }
    return outBuffer;
};

//Round up the given desired size to the closest power of 2 size.
FFT.calculatePow2Size = function (size) {
    return Math.pow(2, Math.ceil(Math.log(size) / Math.log(2)));
};

FFT.calculateBandwidth = function (bufferSize, sampleRate) {
    return 2 / bufferSize * sampleRate / 2;
};

FFT.binIndexToFreq = function (index, bandWidth) {
    return bandWidth * index + bandWidth / 2;
};

FFT.freqToBinIndex = function (freq, bandWidth) {
    return (freq - bandWidth / 2) / (bandWidth);
};

DSP.FFT = FFT;

/* WINDOW FUNCTIONS */

function WindowFunction(func, length) {
    this._func = func;

    //Precalculate buffer of fixed size.
    if (length) {
        const data = new Float32Array(length);
        this._data = data;
        for (let i = 0; i < length; ++i) {
            data[i] = this._func(length, i);
        }
        this.process = function (buffer, out) {
            const length = buffer.length;
            //Storeresult in out buffer.
            if (out) {
                for (let i = 0; i < length; ++i) {
                    out[i] = buffer[i] * data[i];
                }
            }
            //Store result back into in buffer.
            else {
                for (let i = 0; i < length; ++i) {
                    buffer[i] *= data[i];
                }
            }
        };
    }
    //Calculate buffer of arbitrary size each time.
    else {
        this.process = function (buffer, out) {
            const length = buffer.length;
            if (out) {
                for (let i = 0; i < length; ++i) {
                    out[i] = buffer[i] * func(length, i);
                }
            }
            else {
                for (let i = 0; i < length; ++i) {
                    buffer[i] *= func(length, i);
                }
            }
        };
    }
}

WindowFunction.prototype.getData = function () {
    return this._data;
};

const twoPI = 2 * Math.PI;

const windowFunctions = {};

windowFunctions.Bartlett = function (length) {
    const func = function (length, index) {
        return 2 / (length - 1) * ((length - 1) / 2 - Math.abs(index - (length - 1) / 2));
    };
    return new WindowFunction(func, length);
};

windowFunctions.BartlettHann = function (length) {
    const func = function (length, index) {
        return 0.62 - 0.48 * Math.abs(index / (length - 1) - 0.5) - 0.38 * Math.cos(twoPI * index / (length - 1));
    };
    return new WindowFunction(func, length);
};

windowFunctions.Blackman = function (length, alpha) {
    alpha = alpha || 0.16;
    const a0 = (1 - alpha) / 2;
    const a1 = 0.5;
    const a2 = alpha / 2;
    const func = function (length, index) {
        return a0 - a1 * Math.cos(twoPI * index / (length - 1)) + a2 * Math.cos(4 * Math.PI * index / (length - 1));
    };
    return new WindowFunction(func, length);
};

windowFunctions.Cosine = function (length) {
    const func = function (length, index) {
        return Math.cos(Math.PI * index / (length - 1) - Math.PI / 2);
    };
    return new WindowFunction(func, length);
};

windowFunctions.Gauss = function (length, alpha) {
    alpha = alpha || 0.25;
    const func = function (length, index) {
        return Math.pow(Math.E, -0.5 * Math.pow((index - (length - 1) / 2) / (alpha * (length - 1) / 2), 2));
    };
    return new WindowFunction(func, length);
};

windowFunctions.Hamming = function (length) {
    const func = function (length, index) {
        return 0.54 - 0.46 * Math.cos(twoPI * index / (length - 1));
    };
    return new WindowFunction(func, length);
};

windowFunctions.Hann = function (length) {
    const func = function (length, index) {
        return 0.5 * (1 - Math.cos(twoPI * index / (length - 1)));
    };
    return new WindowFunction(func, length);
};

windowFunctions.Lanczos = function (length) {
    const func = function (length, index) {
        const x = 2 * index / (length - 1) - 1;
        return Math.sin(Math.PI * x) / (Math.PI * x);
    };
    return new WindowFunction(func, length);
};

windowFunctions.Rectangular = function () {
    const func = function () {
        return 1;
    };
    return new WindowFunction(func, length);
};

windowFunctions.Triangular = function (length) {
    const func = function (length, index) {
        return 2 / length * (length / 2 - Math.abs(index - (length - 1) / 2));
    };
    return new WindowFunction(func, length);
};

DSP.windowFunctions = windowFunctions;

/* BIQUAD */

DSP.biquad = function (b0, b1, b2, a0, a1, a2) {
    //Normalize coeffs
    this.b0 = b0 / a0;
    this.b1 = b1 / a0;
    this.b2 = b2 / a0;
    this.a1 = a1 / a0;
    this.a2 = a2 / a0;
    this.z1 = 0;
    this.z2 = 0;

    this.processBuffer = function (buffer, outBuffer) {
        if (!outBuffer) {
            outBuffer = buffer;
        }
        for (let i = 0; i < buffer.length; ++i) {
            const out = buffer[i] * this.b0 + this.z1;
            this.z1 = buffer[i] * this.b1 - out * this.a1 + this.z2;
            this.z2 = buffer[i] * this.b2 - out * this.a2;
            outBuffer[i] = out;
        }
    }

    this.processSample = function (sample) {
        const out = sample * this.b0 + this.z1;
        this.z1 = sample * this.b1 - out * this.a1 + this.z2;
        this.z2 = sample * this.b2 - out * this.a2;
        return out;
    }
}

/* ALLPASS */

DSP.allpass = function (fc, fs) {
    //Guard against aliasing .
    if (fc > fs / 2.0001) {
        fc = fs / 2.0001;
    }

    //Calculate biquad coeffs
    const rhoB = Math.tan(Math.PI * fc / fs);
    const pD = (1 - rhoB) / (1 + rhoB)
    const b0 = pD;
    const b1 = -1;
    const b2 = 0;
    const a0 = 1;
    const a1 = -pD;
    const a2 = 0;

    return new DSP.biquad(b0, b1, b2, a0, a1, a2);
}

export default DSP;