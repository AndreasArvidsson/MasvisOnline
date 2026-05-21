// oxlint-disable no-bitwise

export class FFT {
    private readonly _bufferSize: number;
    private readonly _bandwidth: number;
    private readonly _cosTable: Float32Array;
    private readonly _sinTable: Float32Array;
    private readonly _reverseTable: Uint32Array;
    private readonly _real: Float32Array;
    private readonly _imag: Float32Array;

    public constructor(bufferSize: number, sampleRate: number) {
        const bitDepth = Math.floor(Math.log2(bufferSize));

        if (2 ** bitDepth !== bufferSize) {
            throw new Error(
                `Invalid buffer size, must be a power of 2. Given: ${bufferSize}`,
            );
        }

        this._bufferSize = bufferSize;
        this._bandwidth = calculateBandwidth(bufferSize, sampleRate);

        const cosTable = new Float32Array(bufferSize / 2);
        const sinTable = new Float32Array(bufferSize / 2);

        for (let i = 0; i < bufferSize / 2; i++) {
            cosTable[i] = Math.cos((2 * Math.PI * i) / bufferSize);
            sinTable[i] = Math.sin((2 * Math.PI * i) / bufferSize);
        }

        this._cosTable = cosTable;
        this._sinTable = sinTable;
        this._real = new Float32Array(bufferSize);
        this._imag = new Float32Array(bufferSize);

        // Create reverse table.
        const reverseTable = new Uint32Array(bufferSize);
        let limit = 1;
        let bit = bufferSize >> 1;
        let i;

        while (limit < bufferSize) {
            for (i = 0; i < limit; i++) {
                reverseTable[i + limit] = reverseTable[i] + bit;
            }
            limit <<= 1;
            bit >>= 1;
        }

        this._reverseTable = reverseTable;
    }

    public fft(buffer: Float32Array): void {
        if (buffer.length !== this._bufferSize) {
            console.error(
                `Given buffer has size other than expected. Expected: ${
                    this._bufferSize
                } found: ${buffer.length}`,
            );
            return;
        }

        const bufferSize = this._bufferSize;
        const cosTable = this._cosTable;
        const sinTable = this._sinTable;
        const reverseTable = this._reverseTable;
        const real = this._real;
        const imag = this._imag;

        // Apply reverse table.
        for (let i = 0; i < bufferSize; ++i) {
            real[i] = buffer[reverseTable[i]];
            imag[i] = 0;
        }

        // Cooley-Tukey decimation-in-time radix-2 FFT
        for (let size = 2; size <= bufferSize; size *= 2) {
            const halfsize = size / 2;
            const tablestep = bufferSize / size;
            for (let i = 0; i < bufferSize; i += size) {
                for (let j = i, k = 0; j < i + halfsize; ++j, k += tablestep) {
                    const tpre =
                        real[j + halfsize] * cosTable[k] +
                        imag[j + halfsize] * sinTable[k];
                    const tpim =
                        -real[j + halfsize] * sinTable[k] +
                        imag[j + halfsize] * cosTable[k];
                    real[j + halfsize] = real[j] - tpre;
                    imag[j + halfsize] = imag[j] - tpim;
                    real[j] += tpre;
                    imag[j] += tpim;
                }
            }
        }
    }

    public getReal(): Float32Array {
        return this._real;
    }

    public getImaginary(): Float32Array {
        return this._imag;
    }

    public getBandFrequency(index: number): number {
        return this._bandwidth * index + this._bandwidth / 2;
    }

    public calculateSpectrum(): Float32Array {
        const size = this._bufferSize / 2;
        const outBuffer = new Float32Array(size);
        const mult = 1 / this._bufferSize;
        const real = this._real;
        const imag = this._imag;
        const sqrt = Math.sqrt;
        for (let i = 0; i < size; ++i) {
            outBuffer[i] = mult * sqrt(real[i] * real[i] + imag[i] * imag[i]);
        }
        return outBuffer;
    }

    public calculateSpectrumDb(): Float32Array {
        const size = this._bufferSize / 2;
        const outBuffer = new Float32Array(size);
        const mult = 1 / this._bufferSize;
        const real = this._real;
        const imag = this._imag;
        const sqrt = Math.sqrt;
        for (let i = 0; i < size; ++i) {
            outBuffer[i] =
                20 *
                Math.log10(mult * sqrt(real[i] * real[i] + imag[i] * imag[i]));
        }
        return outBuffer;
    }
}

// Round up the given desired size to the closest power of 2 size.
export function calculatePow2Size(size: number): number {
    return 2 ** Math.ceil(Math.log2(size));
}

export function calculateBandwidth(
    bufferSize: number,
    sampleRate: number,
): number {
    return ((2 / bufferSize) * sampleRate) / 2;
}

export function binIndexToFreq(index: number, bandWidth: number): number {
    return bandWidth * index + bandWidth / 2;
}

export function freqToBinIndex(freq: number, bandWidth: number): number {
    return (freq - bandWidth / 2) / bandWidth;
}
