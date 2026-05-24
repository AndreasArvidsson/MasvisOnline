export interface LoudestPart {
    count: number;
    index: number;
}

export interface Histogram {
    graph: Float32Array;
    bits: number;
}

export interface PeakVsRms {
    peak: Float32Array;
    rms: Float32Array;
    crest: Float32Array;
}

export interface OverviewChannel {
    peak: number;
    rms: number;
    crest: number;
    graph: Float32Array;
}

export interface DetailedChannel extends OverviewChannel {
    loudestPart?: LoudestPart;
    avgSpectrum: Float32Array;
    allpass: number[];
    histogram: Histogram;
    peakVsRms: PeakVsRms;
}

export interface UnloadedFile {
    type: "unloaded";
    file: File;
    key: string;
    isProcessing: boolean;
}

export interface LoadedFile extends LoadWorkerResult {
    type: "loaded";
    file: File;
    key: string;
    isProcessing: boolean;
}

export interface DetailedFile
    extends Omit<LoadWorkerResult, "channels">, DetailedWorkerResult {
    type: "detailed";
    file: File;
    key: string;
}

export interface FailedFile {
    type: "failed";
    file: File;
    key: string;
    reason: string;
}

export type AnalysisFile =
    | UnloadedFile
    | LoadedFile
    | DetailedFile
    | FailedFile;

export interface LoadWorkerInput {
    file: File;
}

export interface LoadWorkerResult {
    numChannels: number;
    sampleRate: number;
    bitDepth: number;
    duration: number;
    numSamples: number;
    peak: number;
    rms: number;
    crest: number;
    channels: OverviewChannel[];
}

export interface WorkerErrorResult {
    error: Error;
}

export type LoadWorkerOutput = LoadWorkerResult | WorkerErrorResult;

export interface DetailedWorkerInput {
    channels: OverviewChannel[];
    peak: number;
    sampleRate: number;
    numSamples: number;
    bitDepth: number;
    filename: string;
}

export interface DetailedWorkerResult {
    checksum: number;
    allpass: {
        freqs: number[];
    };
    channels: DetailedChannel[];
}
