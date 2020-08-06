
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
                accept="audio/*"
                onChange={onChange} multiple
            />

            <div onClick={() => inputRef.current.click()}>
                Add files <Glyph type="plus" />
            </div>

            <div onClick={() => selectFile(null)} className={!selectedFile ? "selected" : null}>
                Overview <Glyph type="eye-open" />
            </div>

            <div className="sidebar-table-wrapper">
                <table className="table table-no-wrap table-hover table-striped">
                    <tbody>
                        {files.map(f =>
                            <tr key={f.file.name} className={selectedFile === f ? "selected" : null}>
                                <td onClick={() => selectFile(f)} title={f.file.name}>
                                    <Glyph type={f.isDetailed ? "stats" : "none"} /> {f.file.name}
                                </td>
                                <td className="table-col-icon">
                                    <Glyph type="trash" onClick={() => removeFile(f)} />
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="sidebar-bottom">
                <div>
                    Clear <Glyph type="trash" onClick={removeAllFiles} />
                </div>
                <div>
                    Analyze all <Glyph type="search" onClick={analyzeAll} />
                </div>
                <div>
                    Save image <Glyph type="download" onClick={saveImage} />
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