import type { ChangeEvent, JSX } from "react";
import { useRef } from "react";
import {
    BarChartFill,
    Download,
    EyeFill,
    InfoCircle,
    PlusLg,
    Search,
    Trash3,
} from "react-bootstrap-icons";
import { IconButton } from "./IconButton";
import { IconLoading } from "./IconLoading";
import { IconPlaceholder } from "./IconPlaceholder";
import "./Sidebar.css";
import type { AnalysisFile } from "./types";
import { classNames } from "./util/classNames";

interface SidebarProps {
    files: AnalysisFile[];
    selectedFile: AnalysisFile | undefined;
    selectFile: (file: AnalysisFile | undefined) => void;
    addFiles: (files: FileList) => void;
    removeFile: (file: AnalysisFile) => void;
    removeAllFiles: () => void;
    analyzeAll: () => void;
    saveImage: () => void;
}

export function Sidebar({
    files,
    selectedFile,
    selectFile,
    addFiles,
    removeFile,
    removeAllFiles,
    analyzeAll,
    saveImage,
}: SidebarProps): JSX.Element {
    const inputRef = useRef<HTMLInputElement>(null);

    const onChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            addFiles(files);
        }
    };

    const renderHeader = () => {
        return (
            <div className="sidebar-header">
                <IconButton
                    onClick={() => inputRef.current?.click()}
                    title={
                        "Add new file.\nFiles can also be dropped anywhere on this page."
                    }
                >
                    Add files <PlusLg />
                </IconButton>

                <span className="float-end">
                    <a
                        className="text-decoration-none hover-underline"
                        href="https://github.com/AndreasArvidsson/MasvisOnline"
                        target="_blank"
                        rel="noreferrer"
                        title="Click to visit GitHub page for documentation"
                    >
                        Help <InfoCircle />
                    </a>
                </span>
            </div>
        );
    };

    const renderOverview = () => {
        return (
            <div
                className={classNames(
                    "sidebar-overview",
                    selectedFile == null && "selected-file",
                )}
            >
                <IconButton
                    className="w-100 text-start"
                    title="View overview of all files"
                    onClick={() => selectFile(undefined)}
                >
                    Overview <EyeFill />
                </IconButton>
            </div>
        );
    };

    const renderFiles = () => {
        return (
            <div className="sidebar-table-wrapper">
                <table className="table table-no-wrap table-striped">
                    <tbody>
                        {files.map((f) => (
                            <tr
                                key={f.key}
                                className={
                                    selectedFile === f
                                        ? "selected-file"
                                        : undefined
                                }
                            >
                                <td>
                                    <IconButton
                                        className="w-100 text-start"
                                        title={`View detailes for: ${f.file.name}`}
                                        onClick={() => selectFile(f)}
                                    >
                                        {renderIcon(f)} {f.file.name}
                                    </IconButton>
                                </td>
                                <td className="table-col-icon">
                                    <IconButton
                                        className="hover-danger"
                                        title={`Remove: ${f.file.name}`}
                                        onClick={() => removeFile(f)}
                                    >
                                        <Trash3 />
                                    </IconButton>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderFooter = () => {
        return (
            <div className="row g-0 sidebar-footer">
                <div className="col p-0 text-center">
                    <IconButton
                        className="hover-danger"
                        title="Clear list and remove all files"
                        onClick={removeAllFiles}
                    >
                        Clear <Trash3 />
                    </IconButton>
                </div>
                <div className="col p-0 text-center">
                    <IconButton
                        onClick={analyzeAll}
                        title="Analyse all tracks and calculate details"
                    >
                        Analyze all <Search />
                    </IconButton>
                </div>
                <div className="col p-0 text-center">
                    <IconButton
                        onClick={saveImage}
                        title={`Download image of: ${selectedFile ? selectedFile.file.name : "Overview"}`}
                    >
                        Save image <Download />
                    </IconButton>
                </div>
            </div>
        );
    };

    return (
        <div className="col-5 col-lg-4 col-xxl-3 sidebar">
            <input
                type="file"
                className="d-none"
                ref={inputRef}
                onChange={onChange}
                multiple
                accept={[
                    ".wav",
                    ".aac",
                    ".alac",
                    ".flac",
                    ".mp3",
                    ".ogg",
                    "audio/*",
                ].join(",")}
            />

            {renderHeader()}
            {renderOverview()}
            {renderFiles()}
            {renderFooter()}
        </div>
    );
}

function renderIcon(file: AnalysisFile): JSX.Element {
    if (file.type === "detailed") {
        return <BarChartFill />;
    }
    if (file.isProcessing) {
        return <IconLoading />;
    }
    return <IconPlaceholder />;
}
