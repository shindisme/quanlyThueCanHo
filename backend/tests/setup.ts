import type { PrismaClient } from "@prisma/client";
import { beforeEach, vi } from "vitest";
import {
    mockReset,
    type DeepMockProxy
} from "vitest-mock-extended";

process.env.JWT_SECRET = "test-only-jwt-secret";
process.env.NODE_ENV = "test";

vi.mock("../src/config/database.js", async () => {
    const { mockDeep } = await import("vitest-mock-extended");

    return {
        prisma: mockDeep<PrismaClient>()
    };
});

import { prisma } from "../src/config/database.js";

export const prismaMock = prisma as DeepMockProxy<PrismaClient>;

beforeEach(() => {
    mockReset(prismaMock);
});
