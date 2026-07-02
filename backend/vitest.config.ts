import { fileURLToPath, URL } from "node:url";
import {
    configDefaults,
    defineConfig
} from "vitest/config";

export default defineConfig({
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url))
        }
    },
    test: {
        environment: "node",
        setupFiles: ["./tests/setup.ts"],
        clearMocks: true,
        restoreMocks: true,
        mockReset: true,
        pool: "forks",
        fileParallelism: false,
        exclude: [
            ...configDefaults.exclude,
            ".worktrees/**"
        ]
    }
});
