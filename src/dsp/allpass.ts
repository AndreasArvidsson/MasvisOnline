import { Biquad } from "./Biquad";

export function allpass(fc: number, fs: number): Biquad {
    // Guard against aliasing .
    if (fc > fs / 2.0001) {
        // oxlint-disable-next-line no-param-reassign
        fc = fs / 2.0001;
    }

    // Calculate biquad coeffs
    const rhoB = Math.tan((Math.PI * fc) / fs);
    const pD = (1 - rhoB) / (1 + rhoB);
    const b0 = pD;
    const b1 = -1;
    const b2 = 0;
    const a0 = 1;
    const a1 = -pD;
    const a2 = 0;

    return new Biquad(b0, b1, b2, a0, a1, a2);
}
