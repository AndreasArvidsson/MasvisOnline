// oxlint-disable typescript/no-explicit-any
// oxlint-disable typescript/no-unsafe-assignment
// oxlint-disable typescript/no-unsafe-call
// oxlint-disable typescript/no-unsafe-return
// oxlint-disable typescript/no-unsafe-member-access
// oxlint-disable typescript/no-unsafe-type-assertion
// oxlint-disable import/no-unassigned-import

import AV from "av";
import "flac.js";
import "mp3";
import "alac";
import "aac";

// Fixes main_data_begin pointer error
const mp3Decode = AV.Decoder.find("mp3") as { prototype: any } | null;

if (mp3Decode != null) {
    const originalReadChunk = mp3Decode.prototype.readChunk;

    mp3Decode.prototype.readChunk = function readChunk(this: any) {
        const sync = this.mp3_stream.sync;
        const next_frame = this.mp3_stream.next_frame;
        try {
            return originalReadChunk.bind(this)();
        } catch (error) {
            this.mp3_stream.sync = sync;
            this.mp3_stream.next_frame = next_frame;
            throw error;
        }
    };
}

export { AV };
