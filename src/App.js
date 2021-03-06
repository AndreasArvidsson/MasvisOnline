import Feedback from "owp.feedback";
import Workers from "owp.workers";
import downloadImage from "owp.get-html-as-image";
import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Overview from "./Overview";
import Detailes from "./Detailes";
import loadWorker from "./soundfile-load.worker";
import detailedWorker from "./soundfile-detailed.worker";
import Timer from "./Timer";

let nextState = 1;
function useForceUpdate() {
    const [, setValue] = useState(0);
    return () => setValue(nextState++);
}

const workers = new Workers();

const App = () => {
    const [files, setFiles] = useState([]);
    const [selected, setSelected] = useState(null);
    const forceUpdate = useForceUpdate();

    useEffect(() => {
        files.forEach(f => {
            if (!f.isLoaded) {
                loadFile(f);
            }
        });
    }, [files]);

    const saveImage = () => {
        if (selected) {
            let name = selected.file.name;
            if (name.includes(".")) {
                name = name.substring(0, name.lastIndexOf("."));
            }
            downloadImage("main-details", "masvis-online " + name + ".png");
        }
        else {
            downloadImage("main-overview", "masvis-online overview.png");
        }
    }

    const loadFile = (file) => {
        if (file.isLoading) {
            return;
        }
        file.isLoading = true;
        Timer.start(file.file.name + " [1.x] Calculate overview");
        workers.add(loadWorker, { file: file.file })
            .then(result => {
                Timer.stop(file.file.name + " [1.x] Calculate overview");
                Object.assign(file, result);
                file.isLoaded = true;
                delete file.isLoading;
                forceUpdate();
            })
            .catch(err => {
                Feedback.error(err, { sticky: true });
            });
    }

    const calculateDetailes = (file) => {
        if (file.isCalculating) {
            return;
        }
        file.isCalculating = true;
        Timer.start(file.file.name + " [2.x] Calculate detailes");
        const args = {
            channels: [],
            peak: file.peak,
            sampleRate: file.sampleRate,
            numSamples: file.numSamples,
            bitDepth: file.bitDepth,
            filename: file.file.name
        };
        //Transfer channels to new thread. Increased performance instead of copy.
        const transfer = [];
        for (let i = 0; i < file.channels.length; ++i) {
            args.channels[i] = file.channels[i];
            transfer[i] = file.channels[i].graph.buffer;
        }
        workers.add(detailedWorker, args, transfer)
            .then(result => {
                Timer.stop(file.file.name + " [2.x] Calculate detailes");
                Object.assign(file, result);
                file.isDetailed = true;
                delete file.isCalculating;
                forceUpdate();
            })
            .catch(err => {
                Feedback.error(err, { sticky: true });
            });
    }

    const addFiles = (newFiles) => {
        const tmpFiles = files.slice();
        for (let i = 0; i < newFiles.length; ++i) {
            const file = newFiles[i];
            tmpFiles.push({
                file,
                key: file.name + "_" + Date.now(),
                isLoaded: false,
                isDetailed: false
            });
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
            if (f.isLoaded && !f.isDetailed && f !== selected) {
                calculateDetailes(f);
            }
        });
    }

    const onDrop = (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (e.dataTransfer.files) {
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
                saveImage={saveImage}
            />
            <div id="mainCell">
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
    );
};

export default App;