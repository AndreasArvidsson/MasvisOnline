import Feedback from "owp.feedback";
import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles.css";

(function () {
    //Check so that the browser supports all necessary features.
    if (typeof window.FileReader === "undefined" && typeof window.FileReaderSync === "undefined") {
        Feedback.error("Your browser does not support the HTML5 FileReader.", { sticky: true });
        return;
    }
    if (typeof window.File === "undefined") {
        Feedback.error("Your browser does not support the HTML5 File.", { sticky: true });
        return;
    }
    if (typeof window.Worker === "undefined") {
        Feedback.error("Your browser does not support the HTML5 web worker.", { sticky: true });
        return;
    }

    ReactDOM.render(
        <App />,
        document.getElementById("root")
    );
})();