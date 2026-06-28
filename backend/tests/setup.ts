import type { PrismaClient } from "@prisma/client";
import { beforeEach, vi } from "vitest";
import {
    mockReset,
    type DeepMockProxy
} from "vitest-mock-extended";

process.env.JWT_SECRET = "test-only-jwt-secret";
process.env.NODE_ENV = "test";

const ioMocks = vi.hoisted(() => ({
    imageKitUpload: vi.fn(),
    imageKitDeleteFile: vi.fn(),
    sendMail: vi.fn()
}));

vi.mock("../src/config/database.js", async () => {
    const { mockDeep } = await import("vitest-mock-extended");

    return {
        prisma: mockDeep<PrismaClient>()
    };
});

vi.mock("imagekit", () => ({
    default: class MockImageKit {
        upload = ioMocks.imageKitUpload;
        deleteFile = ioMocks.imageKitDeleteFile;
    }
}));

vi.mock("nodemailer", () => ({
    default: {
        createTransport: () => ({
            sendMail: ioMocks.sendMail
        })
    }
}));

import { prisma } from "../src/config/database.js";

export const prismaMock = prisma as DeepMockProxy<PrismaClient>;
export const imageKitUploadMock = ioMocks.imageKitUpload;
export const imageKitDeleteFileMock = ioMocks.imageKitDeleteFile;
export const sendMailMock = ioMocks.sendMail;

beforeEach(() => {
    mockReset(prismaMock);
});
