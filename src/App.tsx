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
import type {
    AnalysisFile,
    DetailedFile,
    DetailedWorkerInput,
    DetailedWorkerResult,
    FailedFile,
    LoadedFile,
    LoadWorkerInput,
    LoadWorkerOutput,
    UnloadedFile,
} from "./types";
import { getErrorMessage } from "./util/getErrorMessage";
import { notifyError } from "./util/notifyError";

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
    }, [selectedFile?.key, selectedFile?.type]);

    const saveImage = () => {
        if (selectedFile != null) {
            let name = selectedFile.file.name;
            if (name.includes(".")) {
                name = name.slice(0, name.lastIndexOf("."));
            }
            downloadImage("main-details", `masvis-online ${name}.png`).catch(
                notifyError,
            );
        } else {
            downloadImage("main-overview", "masvis-online overview.png").catch(
                notifyError,
            );
        }
    };

    const loadFile = (file: UnloadedFile) => {
        if (file.isProcessing) {
            return;
        }
        file.isProcessing = true;
        // Re-render to show loading state.
        forceUpdate();
        const timerKey = `${file.file.name} [1.x] Calculate overview`;
        console.time(timerKey);
        const args: LoadWorkerInput = {
            file: file.file,
        };
        workers
            .add<LoadWorkerOutput>(loadWorker, args)
            .then((result) => {
                if ("error" in result) {
                    throw result.error;
                }
                console.timeEnd(timerKey);
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
                console.timeEnd(timerKey);
                const reason = `Failed to load file: ${getErrorMessage(error)}`;
                const failedFile: FailedFile = {
                    ...file,
                    type: "failed",
                    reason,
                };
                Object.assign(file, failedFile);
                forceUpdate();
                notifyError(reason);
            });
    };

    const calculateDetails = (file: LoadedFile) => {
        if (file.isProcessing) {
            return;
        }
        file.isProcessing = true;
        forceUpdate();
        const timerKey = `${file.file.name} [2.x] Calculate details`;
        console.time(timerKey);
        const args: DetailedWorkerInput = {
            channels: file.channels,
            peak: file.peak,
            sampleRate: file.sampleRate,
            numSamples: file.numSamples,
            bitDepth: file.bitDepth,
            filename: file.file.name,
        };
        // Transfer channels to new thread. Increased performance instead of copy.
        const transfer = file.channels.map((c) => c.graph.buffer);
        workers
            .add<DetailedWorkerResult>(detailedWorker, args, transfer)
            .then((result) => {
                console.timeEnd(timerKey);
                const detailedFile: DetailedFile = {
                    ...file,
                    ...result,
                    type: "detailed",
                };
                Object.assign(file, detailedFile);
                forceUpdate();
            })
            .catch(notifyError);
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
        <div className="row" onDrop={onDrop} onDragOver={onDragOver}>
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
            <div className="col h-100 overflow-auto p-0">
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
