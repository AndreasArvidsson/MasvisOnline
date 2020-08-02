import Feedback from "owp.feedback";
import Workers from "owp.workers";
import React, { useState, useEffect } from "react";
import AV from "./AV";
import Sidebar from "./Sidebar";
import Overview from "./Overview";
import Detailes from "./Detailes";
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

    const calculateDetailes = (file) => {
        console.time(file.file.name + " - calculateDetailes");

        const args = {
            channels: [],
            peak: file.peak,
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
                console.timeEnd(file.file.name + " - calculateDetailes");
                for(let i in result) {
                    file[i] = result[i];
                }
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
            Feedback.error(file.file.name + "\n" + err, { sticky: true });
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
            if (!fileNames.includes(file.name)) {
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
                calculateDetailes(f);
            }
        });
        setFiles(tmpFiles);
    }

    const onDrop = (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (e.dataTransfer.files) {
            console.log(e.dataTransfer.files)
            addFiles(e.dataTransfer.files);
        }
    }

    const onDragOver = (e) => {
        e.stopPropagation();
        e.preventDefault();
        //Explicitly show this is a copy.
        e.dataTransfer.dropEffect = "copy";
    };

    return (
        <div onDrop={onDrop} onDragOver={onDragOver}>
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
                        ? <Detailes
                            file={selected}
                            isLoaded={selected.isLoaded}
                            isDetailed={selected.isDetailed}
                            calculateDetailes={calculateDetailes}
                        />
                        : <Overview files={files} />
                    }
                </div>
            </div>

        </div>
    );
};

export default App;