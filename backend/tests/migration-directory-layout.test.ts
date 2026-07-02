import {
    readdirSync
} from "node:fs";
import {
    resolve
} from "node:path";
import {
    describe,
    expect,
    it
} from "vitest";

describe("repository migration directory layout", () => {
    it("contains only the audited baseline and pending hardening migration", () => {
        const directories = readdirSync(
            resolve("prisma", "migrations"),
            { withFileTypes: true }
        )
            .filter((entry) => entry.isDirectory())
            .map((entry) => entry.name)
            .sort();

        expect(directories).toEqual([
            "20260627000000_baseline_current_database",
            "20260628000000_harden_integrity_and_scope"
        ]);
    });
});
