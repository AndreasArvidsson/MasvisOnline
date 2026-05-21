import Feedback from "owp.feedback";
import downloadImage from "owp.get-html-as-image";
import Workers from "owp.workers";
import type { DragEvent, JSX } from "react";
import { useEffect, useState } from "react";
import { Detailes } from "./Detailes";
import { Overview } from "./Overview";
import { Sidebar } from "./Sidebar";
// oxlint-disable-next-line import/default
import detailedWorker from "./soundfile-detailed.worker?worker";
// oxlint-disable-next-line import/default
import loadWorker from "./soundfile-load.worker?worker";
import { Timer } from "./Timer";

import type {
    AnalysisFile,
    DetailedWorkerInput,
    DetailedWorkerResult,
    DetailedFile,
    LoadedFile,
    LoadWorkerInput,
    LoadWorkerResult,
    UnloadedFile,
} from "./types";

let nextState = 1;

function useForceUpdate() {
    const [, setValue] = useState(0);
    return () => setValue(nextState++);
}

const workers = new Workers();

export function App(): JSX.Element {
    const [files, setFiles] = useState<AnalysisFile[]>([]);
    const [selectedFile, setSelectedFile] = useState<AnalysisFile>();
    const forceUpdate = useForceUpdate();

    useEffect(() => {
        for (const file of files) {
            if (file.type === "unloaded") {
                loadFile(file);
            }
        }
    }, [files]);

    useEffect(() => {
        if (selectedFile?.type === "loaded") {
            calculateDetails(selectedFile);
        }
    }, [selectedFile]);

    const saveImage = () => {
        if (selectedFile) {
            let name = selectedFile.file.name;
            if (name.includes(".")) {
                name = name.slice(0, name.lastIndexOf("."));
            }
            downloadImage("main-details", `masvis-online ${name}.png`);
        } else {
            downloadImage("main-overview", "masvis-online overview.png");
        }
    };

    const loadFile = (file: UnloadedFile) => {
        if (file.isProcessing) {
            return;
        }
        file.isProcessing = true;
        const timerKey = `${file.file.name} [1.x] Calculate overview`;
        Timer.start(timerKey);
        const args: LoadWorkerInput = { file: file.file };
        workers
            .add<LoadWorkerResult>(loadWorker, args)
            .then((result) => {
                Timer.stop(timerKey);
                const loadedFile: LoadedFile = {
                    ...file,
                    ...result,
                    type: "loaded",
                    isProcessing: false,
                };
                Object.assign(file, loadedFile);
                forceUpdate();
            })
            .catch((error: unknown) => {
                Feedback.error(error, { sticky: true });
            });
    };

    const calculateDetails = (file: LoadedFile) => {
        if (file.isProcessing) {
            return;
        }
        file.isProcessing = true;
        const timerKey = `${file.file.name} [2.x] Calculate details`;
        Timer.start(timerKey);
        const args: DetailedWorkerInput = {
            channels: [],
            peak: file.peak,
            sampleRate: file.sampleRate,
            numSamples: file.numSamples,
            bitDepth: file.bitDepth,
            filename: file.file.name,
        };
        // Transfer channels to new thread. Increased performance instead of copy.
        const transfer: Transferable[] = [];
        for (let i = 0; i < file.channels.length; ++i) {
            args.channels[i] = file.channels[i];
            transfer[i] = file.channels[i].graph.buffer;
        }
        workers
            .add<DetailedWorkerResult>(detailedWorker, args, transfer)
            .then((result) => {
                Timer.stop(timerKey);
                const detailedFile: DetailedFile = {
                    ...file,
                    ...result,
                    type: "detailed",
                };
                Object.assign(file, detailedFile);
                forceUpdate();
            })
            .catch((error: unknown) => {
                Feedback.error(error, { sticky: true });
            });
    };

    const addFiles = (newFiles: FileList) => {
        const tmpFiles = files.slice();
        for (const file of newFiles) {
            tmpFiles.push({
                type: "unloaded",
                file,
                isProcessing: false,
                key: `${file.name}_${Date.now()}`,
            });
        }
        setFiles(tmpFiles);
    };

    const removeFile = (file: AnalysisFile) => {
        const tmpFiles = files.slice();
        tmpFiles.splice(files.indexOf(file), 1);
        setFiles(tmpFiles);
        if (file === selectedFile) {
            setSelectedFile(undefined);
        }
    };

    const removeAllFiles = () => {
        setFiles([]);
    };

    const analyzeAll = () => {
        const tmpFiles = files.slice();
        for (const file of tmpFiles) {
            if (file.type === "loaded") {
                calculateDetails(file);
            }
        }
    };

    const onDrop = (e: DragEvent<HTMLDivElement>) => {
        e.stopPropagation();
        e.preventDefault();
        addFiles(e.dataTransfer.files);
    };

    return (
        <div onDrop={onDrop} onDragOver={onDragOver}>
            <Sidebar
                files={files}
                selectedFile={selectedFile}
                selectFile={setSelectedFile}
                addFiles={addFiles}
                removeFile={removeFile}
                removeAllFiles={removeAllFiles}
                analyzeAll={analyzeAll}
                saveImage={saveImage}
            />
            <div id="mainCell">
                {selectedFile != null ? (
                    <Detailes file={selectedFile} />
                ) : (
                    <Overview files={files} />
                )}
            </div>
        </div>
    );
}

function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.stopPropagation();
    e.preventDefault();
    // Explicitly show this is a copy.
    e.dataTransfer.dropEffect = "copy";
}
