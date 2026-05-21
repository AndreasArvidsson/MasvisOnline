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

    return {
        enforce: "pre",
        name: "legacy-audio-packages",

        load(id) {
            if (id === propTypesStub) {
                return "export default { object: undefined };";
            }

            if (id.endsWith(".coffee")) {
                const jsPath = `${id.slice(0, -".coffee".length)}.js`;
                return fs.readFileSync(jsPath, "utf8");
            }

            const normalizedId = id.replaceAll("\\", "/");

            if (normalizedId.endsWith("/node_modules/flac.js/src/ogg.js")) {
                return fs
                    .readFileSync(id, "utf8")
                    .replace(String.raw`"\177FLAC"`, String.raw`"\x7fFLAC"`);
            }

            return undefined;
        },

        resolveId(source) {
            if (source === "av") {
                return path.join(__dirname, "node_modules/av/src/aurora.js");
            }

            if (source === "prop-types") {
                return propTypesStub;
            }

            return undefined;
        },
    };
}
