const AV = require("../lib/aurora")
require("../lib/alac");
require("../lib/flac");
require("../lib/mp3");

//Fixes main_data_begin pointer error
const mp3Decode = AV.Decoder.find("mp3");
const readChunk = mp3Decode.prototype.readChunk
mp3Decode.prototype.readChunk = function () {
    const sync = this.mp3_stream.sync;
    const next_frame = this.mp3_stream.next_frame;
    try {
        return readChunk.bind(this)();
    }
    catch (err) {
        this.mp3_stream.sync = sync;
        this.mp3_stream.next_frame = next_frame;
        throw err;
    }
}

export default AV;