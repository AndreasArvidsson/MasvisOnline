import React from "react";
const pjson = require("../package.json");

const VersionTag = () => {
    const d = new Date();
    return (
        <div className="versionTag">
            <span>
                MasVis online v{pjson.version}
                &nbsp;@&nbsp;
                {d.getFullYear()}-
                {pad(d.getMonth() + 1)}-
                {pad(d.getDate())}
            </span>
        </div>
    );
}

export default VersionTag;

function pad(value) {
    return ("0" + value.toString()).slice(-2);
}