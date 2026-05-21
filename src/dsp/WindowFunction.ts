const twoPI = 2 * Math.PI;

class WindowFunction {
    public constructor(private readonly data: Float32Array) {}

    public process(buffer: Float32Array) {
        // Store result in out buffer.
        for (let i = 0; i < buffer.length; ++i) {
            buffer[i] *= this.data[i];
        }
    }

    public getData() {
        return this.data;
    }
}

export function bartlettWindow(length: number): WindowFunction {
    const data = new Float32Array(length);
    for (let i = 0; i < length; ++i) {
        data[i] =
            (2 / (length - 1)) *
            ((length - 1) / 2 - Math.abs(i - (length - 1) / 2));
    }
    return new WindowFunction(data);
}

export function bartlettHannWindow(length: number): WindowFunction {
    const data = new Float32Array(length);
    for (let i = 0; i < length; ++i) {
        data[i] =
            0.62 -
            0.48 * Math.abs(i / (length - 1) - 0.5) -
            0.38 * Math.cos((twoPI * i) / (length - 1));
    }
    return new WindowFunction(data);
}

export function blackmanWindow(length: number, alpha = 0.16): WindowFunction {
    const a0 = (1 - alpha) / 2;
    const a1 = 0.5;
    const a2 = alpha / 2;
    const data = new Float32Array(length);
    for (let i = 0; i < length; ++i) {
        data[i] =
            a0 -
            a1 * Math.cos((twoPI * i) / (length - 1)) +
            a2 * Math.cos((4 * Math.PI * i) / (length - 1));
    }
    return new WindowFunction(data);
}

export function cosineWindow(length: number): WindowFunction {
    const data = new Float32Array(length);
    for (let i = 0; i < length; ++i) {
        data[i] = Math.cos((Math.PI * i) / (length - 1) - Math.PI / 2);
    }
    return new WindowFunction(data);
}

export function gaussWindow(length: number, alpha = 0.25): WindowFunction {
    const data = new Float32Array(length);
    for (let i = 0; i < length; ++i) {
        data[i] =
            Math.E **
            ((-0.5 * (i - (length - 1) / 2)) /
                ((alpha * (length - 1)) / 2) ** 2);
    }
    return new WindowFunction(data);
}

export function hammingWindow(length: number): WindowFunction {
    const data = new Float32Array(length);
    for (let i = 0; i < length; ++i) {
        data[i] = 0.54 - 0.46 * Math.cos((twoPI * i) / (length - 1));
    }
    return new WindowFunction(data);
}

export function hannWindow(length: number): WindowFunction {
    const data = new Float32Array(length);
    for (let i = 0; i < length; ++i) {
        data[i] = 0.5 * (1 - Math.cos((twoPI * i) / (length - 1)));
    }
    return new WindowFunction(data);
}

export function lanczosWindow(length: number): WindowFunction {
    const data = new Float32Array(length);
    for (let i = 0; i < length; ++i) {
        const x = (2 * i) / (length - 1) - 1;
        data[i] = Math.sin(Math.PI * x) / (Math.PI * x);
    }
    return new WindowFunction(data);
}

export function rectangularWindow(length: number): WindowFunction {
    const data = new Float32Array(length);
    for (let i = 0; i < length; ++i) {
        data[i] = 1;
    }
    return new WindowFunction(data);
}

export function triangularWindow(length: number): WindowFunction {
    const data = new Float32Array(length);
    for (let i = 0; i < length; ++i) {
        data[i] = (2 / length) * (length / 2 - Math.abs(i - (length - 1) / 2));
    }
    return new WindowFunction(data);
}
