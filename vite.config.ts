import fs from "node:fs";
import path from "node:path";
import type { Plugin, UserConfig } from "vite";
import { defineConfig } from "vite";

// oxlint-disable-next-line import/no-default-export
export default defineConfig((): UserConfig => {
    return {
        plugins: [legacyAudioPackages()],

        worker: {
            plugins: () => [legacyAudioPackages()],
        },

        esbuild: {
            jsx: "automatic",
        },

        build: {
            outDir: path.join(__dirname, "docs"),
            target: "es2020",
            sourcemap: true,

            rollupOptions: {
                input: path.join(__dirname, "src/index.html"),
            },
        },
    };
});

function legacyAudioPackages(): Plugin {
    const propTypesStub = "\0prop-types-stub";
    const avEntry = path.join(__dirname, "node_modules/av/src/aurora.js");
    const browserFileSource = path.join(
        __dirname,
        "node_modules/av/src/sources/browser/file.js",
    );
    const browserHttpSource = path.join(
        __dirname,
        "node_modules/av/src/sources/browser/http.js",
    );
    const flacOgg = path.join(__dirname, "node_modules/flac.js/src/ogg.js");

    return {
        enforce: "pre",
        name: "legacy-audio-packages",

        load(id) {
            if (id === propTypesStub) {
                return "export default { object: undefined };";
            }

            const normalizedId = id.replaceAll("\\", "/");

            if (normalizedId.endsWith("/node_modules/flac.js/src/ogg.js")) {
                return fs
                    .readFileSync(flacOgg, "utf8")
                    .replace(String.raw`"\177FLAC"`, String.raw`"\x7fFLAC"`);
            }

            if (
                normalizedId.endsWith(
                    "/node_modules/av/src/sources/browser/file.coffee",
                )
            ) {
                return fs.readFileSync(browserFileSource, "utf8");
            }

            if (
                normalizedId.endsWith(
                    "/node_modules/av/src/sources/browser/http.coffee",
                )
            ) {
                return fs.readFileSync(browserHttpSource, "utf8");
            }

            return undefined;
        },

        resolveId(source) {
            const normalizedSource = source.replaceAll("\\", "/");

            if (normalizedSource === "av") {
                return avEntry;
            }

            if (normalizedSource === "prop-types") {
                return propTypesStub;
            }

            return undefined;
        },
    };
}
