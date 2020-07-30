import Feedback from "owp.feedback";
import Workers from "owp.workers";
import React, { useState, useEffect } from "react";
const AV = require("../lib/aurora")
window.AV = AV;
require("../lib/flac");
require("../lib/mp3");
import Sidebar from "./Sidebar";
import Overview from "./Overview";
import Detailed from "./Detailed";
import loadWorker from "./soundfile-load.worker";
import detailedWorker from "./soundfile-detailed.worker";

const workers = new Workers();

const App = () => {
    const [files, setFiles] = useState([]);
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        files.forEach(f => {
            if (!f.isLoaded) {
                loadFile(f);
            }
        });
    }, [files]);

    const calculateDetailed = (file) => {
        console.time(file.file.name + " - calculateDetailed");

        const args = {
            channels: [],
            maxValue: file.peak,
            sampleRate: file.sampleRate,
            numSamples: file.numSamples
        };
        //Transfer channels to new thread. Increased performance instead of copy.
        const transfer = [];
        for (let i = 0; i < file.channels.length; ++i) {
            args.channels[i] = file.channels[i];
            transfer[i] = file.channels[i].graph.buffer;
        }
        workers.add(detailedWorker, args, transfer)
            .then(result => {
                console.timeEnd(file.file.name + " - calculateDetailed");
                file.channels = result.channels;
                file.isDetailed = true;
                setFiles(files.slice());
            })
            .catch(err => {
                Feedback.error(err, { sticky: true });
            });
    }

    const loadFile = (file) => {
        const asset = AV.Asset.fromFile(file.file);

        console.time(file.file.name + " - decodeToBuffer");
        console.time(file.file.name + " - total");

        asset.on("error", err => {
            Feedback.error(err, { sticky: true });
        });

        let format, buffer, duration;

        const addWorker = () => {
            if (format && buffer && duration) {
                console.timeEnd(file.file.name + " - decodeToBuffer");
                console.time(file.file.name + " - loadBasic");
                workers.add(loadWorker, { format, duration, buffer }, [buffer.buffer])
                    .then(result => {
                        console.timeEnd(file.file.name + " - loadBasic");
                        console.timeEnd(file.file.name + " - total");
                        Object.assign(file, result);
                        file.isLoaded = true;
                        setFiles(files.slice());
                    })
                    .catch(err => {
                        Feedback.error(err, { sticky: true });
                    });
            }
        };

        asset.on("format", f => {
            format = f;
            addWorker();
        });
        asset.on("duration", d => {
            duration = d;
            addWorker();
        });

        asset.decodeToBuffer(b => {
            buffer = b;
            addWorker();
        });
    }

    const addFiles = (newFiles) => {
        const tmpFiles = files.slice();
        const fileNames = files.map(f => f.file.name);
        for (let i = 0; i < newFiles.length; ++i) {
            const file = newFiles[i];
            if (isSoundFile(file) && !fileNames.includes(file.name)) {
                tmpFiles.push({
                    file,
                    isLoaded: false,
                    isDetailed: false
                });
            }
        }
        setFiles(tmpFiles);
    }

    const removeFile = (file) => {
        const tmpFiles = files.slice();
        tmpFiles.splice(files.indexOf(file), 1);
        setFiles(tmpFiles);
        if (file === selected) {
            setSelected(null);
        }
    }

    const removeAllFiles = () => {
        setFiles([]);
    }

    const analyzeAll = () => {
        const tmpFiles = files.slice();
        tmpFiles.forEach(f => {
            //Cant be already detailed or working.
            if (!f.isDetailed && f !== selected) {
                calculateDetailed(f);
            }
        });
        setFiles(tmpFiles);
    }

    return (
        <React.Fragment>
            <Sidebar
                files={files}
                selectedFile={selected}
                selectFile={setSelected}
                addFiles={addFiles}
                removeFile={removeFile}
                removeAllFiles={removeAllFiles}
                analyzeAll={analyzeAll}
            />

            <div id="mainCell">
                <div id="mainDiv">
                    {selected
                        ? <Detailed
                            file={selected}
                            isLoaded={selected.isLoaded}
                            isDetailed={selected.isDetailed}
                            calculateDetailed={calculateDetailed}
                        />
                        : <Overview files={files} />
                    }
                </div>
            </div>

        </React.Fragment>
    );
};

export default App;

function isSoundFile(file) {
    const i = file.name.lastIndexOf(".");
    const ending = file.name.substr(i + 1).toLowerCase();
    return ending === "wav" || ending === "flac" || ending === "mp3";
}