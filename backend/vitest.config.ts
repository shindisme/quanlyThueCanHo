import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        setupFiles: ["./tests/setup.ts"],
        clearMocks: true,
        restoreMocks: true,
        mockReset: true,
        pool: "forks",
        fileParallelism: false
    }
});
