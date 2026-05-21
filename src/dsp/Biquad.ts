export class Biquad {
    public readonly b0: number;
    public readonly b1: number;
    public readonly b2: number;
    public readonly a1: number;
    public readonly a2: number;
    private z1: number;
    private z2: number;

    public constructor(
        b0: number,
        b1: number,
        b2: number,
        a0: number,
        a1: number,
        a2: number,
    ) {
        // Normalize coeffs
        this.b0 = b0 / a0;
        this.b1 = b1 / a0;
        this.b2 = b2 / a0;
        this.a1 = a1 / a0;
        this.a2 = a2 / a0;
        this.z1 = 0;
        this.z2 = 0;
    }

    public processBuffer(buffer: Float32Array): void {
        for (let i = 0; i < buffer.length; ++i) {
            const out = buffer[i] * this.b0 + this.z1;
            this.z1 = buffer[i] * this.b1 - out * this.a1 + this.z2;
            this.z2 = buffer[i] * this.b2 - out * this.a2;
            buffer[i] = out;
        }
    }

    public processSample(sample: number): number {
        const out = sample * this.b0 + this.z1;
        this.z1 = sample * this.b1 - out * this.a1 + this.z2;
        this.z2 = sample * this.b2 - out * this.a2;
        return out;
    }
}
