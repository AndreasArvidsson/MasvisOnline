import path from "node:path";
import type { UserConfig } from "vite";
import { defineConfig } from "vite";

// oxlint-disable-next-line import/no-default-export
export default defineConfig((): UserConfig => {
    return {
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
