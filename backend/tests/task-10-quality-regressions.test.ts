import {
    PaymentStatus,
    Role,
    UserStatus
} from "@prisma/client";
import request from "supertest";
import {
    beforeEach,
    describe,
    expect,
    it
} from "vitest";
import paymentRouter from "../src/routes/payment.routes.js";
import uploadRouter from "../src/routes/upload.routes.js";
import { createBearerToken } from "./helpers/auth.js";
import { createTestApp } from "./helpers/test-app.js";
import {
    imageKitUploadMock,
    prismaMock
} from "./setup.js";

const ADMIN_USER_ID = 101;
const INVOICE_ID = 501;

const authenticateAsAdmin = () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
        id: ADMIN_USER_ID,
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
        staff: null,
        tenant: null
    } as never);
};

const authorization = () => createBearerToken(ADMIN_USER_ID);
const paymentApp = () => createTestApp(paymentRouter, "/payments");
const uploadApp = () => createTestApp(uploadRouter, "/uploads");

beforeEach(() => {
    imageKitUploadMock.mockReset();
});

describe("Task 10 quality regressions", () => {
    it.each([
        0.001,
        10_000_000_000
    ])(
        "rejects out-of-domain payment amount %s before a transaction",
        async (amount) => {
            authenticateAsAdmin();

            const response = await request(paymentApp())
                .post("/payments")
                .set("Authorization", authorization())
                .send({
                    invoice_id: INVOICE_ID,
                    payment_method: "CASH",
                    amount,
                    status: PaymentStatus.SUCCESS
                });

            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe("VALIDATION_ERROR");
            expect(prismaMock.$transaction).not.toHaveBeenCalled();
            expect(prismaMock.invoice.findFirst).not.toHaveBeenCalled();
            expect(prismaMock.payment.create).not.toHaveBeenCalled();
        }
    );

    it("rejects forged JPEG content before ImageKit upload", async () => {
        authenticateAsAdmin();

        const response = await request(uploadApp())
            .post("/uploads/upload-multiple")
            .set("Authorization", authorization())
            .attach("images", Buffer.from("<html>forged</html>"), {
                filename: "forged.jpg",
                contentType: "image/jpeg"
            });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe(
            "INVALID_FILE_CONTENT"
        );
        expect(imageKitUploadMock).not.toHaveBeenCalled();
    });

    it("accepts a JPEG buffer with the required signature", async () => {
        authenticateAsAdmin();
        imageKitUploadMock.mockResolvedValueOnce({
            url: "https://images.example/minimal.jpg",
            fileId: "minimal-jpeg"
        });

        const response = await request(uploadApp())
            .post("/uploads/upload-multiple")
            .set("Authorization", authorization())
            .attach("images", Buffer.from([0xff, 0xd8, 0xff]), {
                filename: "minimal.jpg",
                contentType: "image/jpeg"
            });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            success: true,
            data: {
                urls: ["https://images.example/minimal.jpg"]
            }
        });
        expect(imageKitUploadMock).toHaveBeenCalledTimes(1);
    });
});
