import "bootstrap/dist/css/bootstrap.min.css";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

const root = document.getElementById("root");

if (root == null) {
    throw new Error("Root element not found");
}

createRoot(root).render(<App />);
