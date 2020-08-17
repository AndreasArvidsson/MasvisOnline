
import React from "react";
import PropTypes from "prop-types";
import Glyph from "owp.glyphicons";
import "./Sidebar.css";

const inputRef = React.createRef();

const Sidebar = ({ files, selectedFile, selectFile, addFiles, removeFile, removeAllFiles, analyzeAll, saveImage }) => {
    const onChange = (e) => {
        const files = e.target.files;
        if (files) {
            addFiles(files);
        }
    }
    return (
        <div className="sidebar">
            <input
                type="file"
                ref={inputRef}
                accept=".flac,.mp3,.wav,audio/*"
                onChange={onChange}
                multiple
            />

            <div>
                <span
                    className="clickable"
                    onClick={() => inputRef.current.click()}
                    title={"Add new file.\nFiles can also be dropped anywhere on this page."}
                >
                    Add files <Glyph type="plus" />
                </span>
                <span style={{ float: "right" }}>
                    <a
                        className="clickable"
                        href="https://github.com/AndreasArvidsson/MasvisOnline"
                        target="_blank"
                        rel="noreferrer"
                        title="Click to visit GitHub page for documentation"
                    >
                        Help <Glyph type="info-sign" />
                    </a>
                </span>
            </div>

            <div
                className={"clickable" + (!selectedFile ? " selected" : "")}
                onClick={() => selectFile(null)}
                title="View overview of all files"
            >
                Overview <Glyph type="eye-open" />
            </div>

            <div className="sidebar-table-wrapper">
                <table className="table table-no-wrap table-striped">
                    <tbody>
                        {files.map(f =>
                            <tr
                                key={f.key}
                                className={selectedFile === f ? "selected" : null}
                            >
                                <td
                                    className="clickable"
                                    onClick={() => selectFile(f)}
                                    title={"View detailes for: " + f.file.name}
                                >
                                    <Glyph type={f.isDetailed ? "stats" : "none"} /> {f.file.name}
                                </td>
                                <td
                                    className="table-col-icon clickable"
                                    title={"Remove: " + f.file.name}
                                >
                                    <Glyph type="trash danger" onClick={() => removeFile(f)} />
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="sidebar-bottom">
                <div>
                    <span
                        className="clickable"
                        onClick={removeAllFiles}
                        title="Clear list and remove all files"
                    >
                        Clear <Glyph type="trash" />
                    </span>
                </div>
                <div>
                    <span
                        className="clickable"
                        onClick={analyzeAll}
                        title="Analyse all tracks and calculate details"
                    >
                        Analyze all <Glyph type="search" />
                    </span>
                </div>
                <div>
                    <span
                        className="clickable"
                        onClick={saveImage}
                        title={"Download image of: " + (selectedFile ? selectedFile.file.name : "Overview")}
                    >
                        Save image <Glyph type="download" />
                    </span>
                </div>
            </div>

        </div>
    );
};

Sidebar.propTypes = {
    files: PropTypes.array.isRequired,
    selectedFile: PropTypes.object,
    selectFile: PropTypes.func.isRequired,
    addFiles: PropTypes.func.isRequired,
    removeFile: PropTypes.func.isRequired,
    removeAllFiles: PropTypes.func.isRequired,
    analyzeAll: PropTypes.func.isRequired,
    saveImage: PropTypes.func.isRequired
};

export default Sidebar;