import {
    ContractStatus,
    InvoiceStatus,
    PaymentStatus,
    Prisma,
    Role,
    UserStatus
} from "@prisma/client";
import request from "supertest";
import {
    beforeEach,
    describe,
    expect,
    it,
    vi
} from "vitest";
import chatbotRouter from "../src/routes/chatbot.route.js";
import paymentRouter from "../src/routes/payment.routes.js";
import reviewRouter from "../src/routes/review.routes.js";
import uploadRouter from "../src/routes/upload.routes.js";
import { createBearerToken } from "./helpers/auth.js";
import { createTestApp } from "./helpers/test-app.js";
import { jpegFixture } from "./helpers/image-fixture.js";
import { pngFixture, webpFixture } from "./helpers/png-webp-fixture.js";
import {
    imageKitDeleteFileMock,
    imageKitUploadMock,
    prismaMock
} from "./setup.js";
import app, { ROUTE_MOUNTS } from "../src/app.js";
import { startServer } from "../src/server.js";
import { startMonthlyInvoiceScheduler } from "../src/services/invoice.service.js";

const chatbotMocks = vi.hoisted(() => ({
    processCustomerMessage: vi.fn()
}));

const schedulerMocks = vi.hoisted(() => ({
    startMonthlyInvoiceScheduler: vi.fn()
}));

vi.mock("../src/services/chatbot.service.js", () => ({
    processCustomerMessage: chatbotMocks.processCustomerMessage
}));

vi.mock("../src/services/invoice.service.js", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../src/services/invoice.service.js")>();
    return {
        ...actual,
        startMonthlyInvoiceScheduler: schedulerMocks.startMonthlyInvoiceScheduler
    };
});

const MANAGER_USER_ID = 101;
const ADMIN_USER_ID = 102;
const TENANT_USER_ID = 103;
const MANAGER_STAFF_ID = 201;
const TENANT_ID = 202;
const BUILDING_ID = 301;
const APARTMENT_ID = 401;
const INVOICE_ID = 501;
const PAYMENT_ID = 601;

const managerAssignment = {
    assigned_staff: {
        some: {
            id: MANAGER_STAFF_ID,
            user_id: MANAGER_USER_ID,
            user: {
                is: {
                    id: MANAGER_USER_ID,
                    role: Role.MANAGER,
                    status: UserStatus.ACTIVE
                }
            }
        }
    }
};

const authenticateAs = (role: Role) => {
    const id = role === Role.ADMIN
        ? ADMIN_USER_ID
        : role === Role.TENANT
            ? TENANT_USER_ID
            : MANAGER_USER_ID;

    prismaMock.user.findUnique.mockResolvedValueOnce({
        id,
        role,
        status: UserStatus.ACTIVE,
        staff: role === Role.MANAGER
            ? {
                id: MANAGER_STAFF_ID,
                building_id: BUILDING_ID
            }
            : null,
        tenant: role === Role.TENANT
            ? { id: TENANT_ID }
            : null
    } as never);
};

const authorizationFor = (role: Role) => createBearerToken(
    role === Role.ADMIN
        ? ADMIN_USER_ID
        : role === Role.TENANT
            ? TENANT_USER_ID
            : MANAGER_USER_ID
);

const paymentApp = () => createTestApp(paymentRouter, "/payments");
const reviewApp = () => createTestApp(reviewRouter, "/reviews");
const chatbotApp = () => createTestApp(chatbotRouter, "/chat");
const uploadApp = () => createTestApp(uploadRouter, "/uploads");

describe("application route mounts and scheduler", () => {
    beforeEach(() => {
        vi.mocked(startMonthlyInvoiceScheduler).mockClear();
    });

    it("mounts contracts and uploads exactly once", () => {
        expect(ROUTE_MOUNTS.filter(([path]) => path === "/contracts"))
            .toHaveLength(1);
        expect(ROUTE_MOUNTS.filter(([path]) => path === "/uploads"))
            .toHaveLength(1);
    });

    it("protects standalone upload through the mounted application", async () => {
        const response = await request(app)
            .post("/uploads/upload-multiple")
            .set("Content-Type", "multipart/form-data")
            .send("not-valid-multipart");

        expect(response.status).toBe(401);
        expect(response.body.error.code).toBe("AUTHENTICATION_REQUIRED");
    });

    it("starts the invoice scheduler once after listen", () => {
        vi.spyOn(app, "listen").mockImplementation(((
            _port: number,
            callback: () => void
        ) => {
            callback();
            return { close: vi.fn() };
        }) as never);

        startServer();

        expect(startMonthlyInvoiceScheduler).toHaveBeenCalledTimes(1);
    });
});

const tenant = {
    id: TENANT_ID,
    full_name: "Tenant",
    phone: "0901000000",
    email: "tenant@example.com",
    user_id: TENANT_USER_ID
};

const apartment = {
    id: APARTMENT_ID,
    building_id: BUILDING_ID,
    floor: 1,
    room_number: "A101",
    area: 55,
    rental_price: 8_000_000,
    building: {
        id: BUILDING_ID,
        branch_name: "Central",
        address_new: "12 New Street"
    }
};

const makeInvoice = (
    payments: Array<{
        id: number;
        invoice_id: number;
        payment_method: string;
        transaction_code: string | null;
        amount: number;
        status: PaymentStatus;
        paid_at: Date;
    }> = [],
    status = InvoiceStatus.UNPAID
) => ({
    id: INVOICE_ID,
    contract_id: 701,
    tenant_id: TENANT_ID,
    invoice_code: "INV-2030-01",
    due_date: new Date("2030-01-10T00:00:00.000Z"),
    total_amount: 1_000,
    status,
    created_at: new Date("2030-01-01T00:00:00.000Z"),
    paid_at: status === InvoiceStatus.PAID
        ? new Date("2030-01-05T00:00:00.000Z")
        : null,
    payments,
    contract: {
        id: 701,
        apartment_id: APARTMENT_ID,
        tenant_id: TENANT_ID,
        start_date: new Date("2029-01-01T00:00:00.000Z"),
        end_date: new Date("2030-01-01T00:00:00.000Z"),
        deposit_amount: 1_000,
        monthly_rent: 1_000,
        status: ContractStatus.ENDED,
        contract_file: null,
        signed_at: new Date("2028-12-20T00:00:00.000Z"),
        created_at: new Date("2028-12-20T00:00:00.000Z"),
        extended_at: null,
        tenant,
        apartment
    }
});

const makePayment = (
    status = PaymentStatus.PENDING,
    invoice = makeInvoice()
) => ({
    id: PAYMENT_ID,
    invoice_id: INVOICE_ID,
    payment_method: "BANK_TRANSFER",
    transaction_code: "TX-1",
    amount: 600,
    status,
    paid_at: new Date("2030-01-05T00:00:00.000Z"),
    invoice
});

const prismaConflict = (code: "P2002" | "P2025" | "P2034") =>
    new Prisma.PrismaClientKnownRequestError(
        "Prisma conflict",
        {
            code,
            clientVersion: "6.15.0"
        }
    );

beforeEach(() => {
    prismaMock.$transaction.mockImplementation(
        async (operation: unknown) => {
            if (typeof operation === "function") {
                return (
                    operation as (
                        client: typeof prismaMock
                    ) => Promise<unknown>
                )(prismaMock);
            }

            return Promise.all(operation as Promise<unknown>[]);
        }
    );
});

describe("payment API normalization and scope", () => {
    it.each([
        [{ invoice_id: true, payment_method: "CASH" }],
        [{ invoice_id: INVOICE_ID, payment_method: "" }],
        [{
            invoice_id: INVOICE_ID,
            payment_method: "CASH",
            status: "UNKNOWN"
        }],
        [{
            invoice_id: INVOICE_ID,
            payment_method: "CASH",
            privileged: true
        }]
    ])("rejects invalid create input before database access", async (body) => {
        authenticateAs(Role.ADMIN);

        const response = await request(paymentApp())
            .post("/payments")
            .set("Authorization", authorizationFor(Role.ADMIN))
            .send(body);

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe("VALIDATION_ERROR");
        expect(prismaMock.invoice.findFirst).not.toHaveBeenCalled();
        expect(prismaMock.invoice.findUnique).not.toHaveBeenCalled();
        expect(prismaMock.payment.create).not.toHaveBeenCalled();
    });

    it("uses the authenticated Manager assignment without re-querying a profile", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.payment.findMany.mockResolvedValueOnce([]);
        prismaMock.payment.count.mockResolvedValueOnce(0);

        const response = await request(paymentApp())
            .get("/payments?page=1&limit=20")
            .set("Authorization", authorizationFor(Role.MANAGER));

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            success: true,
            data: [],
            meta: {
                pagination: {
                    total: 0,
                    page: 1,
                    limit: 20,
                    totalPages: 0
                }
            }
        });
        expect(prismaMock.staff.findUnique).not.toHaveBeenCalled();
        expect(prismaMock.payment.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    AND: [{
                        invoice: {
                            contract: {
                                apartment: {
                                    building_id: BUILDING_ID,
                                    building: managerAssignment
                                }
                            }
                        }
                    }]
                }
            })
        );
    });

    it("hides a point read outside the authenticated Tenant scope", async () => {
        authenticateAs(Role.TENANT);
        prismaMock.payment.findFirst.mockResolvedValueOnce(null);

        const response = await request(paymentApp())
            .get(`/payments/${PAYMENT_ID}`)
            .set("Authorization", authorizationFor(Role.TENANT));

        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe("NOT_FOUND");
        expect(prismaMock.tenant.findUnique).not.toHaveBeenCalled();
        expect(prismaMock.payment.findFirst).toHaveBeenCalledWith({
            where: {
                id: PAYMENT_ID,
                invoice: {
                    tenant_id: TENANT_ID
                }
            },
            include: expect.any(Object)
        });
    });

    it("keeps the final Manager status write under the live assignment scope", async () => {
        authenticateAs(Role.MANAGER);
        const current = makePayment();
        const successfulPayment = {
            ...current,
            status: PaymentStatus.SUCCESS
        };
        const invoiceWithSuccess = makeInvoice([{
            id: PAYMENT_ID,
            invoice_id: INVOICE_ID,
            payment_method: "BANK_TRANSFER",
            transaction_code: "TX-1",
            amount: 600,
            status: PaymentStatus.SUCCESS,
            paid_at: current.paid_at
        }]);

        prismaMock.payment.findFirst
            .mockResolvedValueOnce(current as never)
            .mockResolvedValueOnce({
                ...successfulPayment,
                invoice: invoiceWithSuccess
            } as never);
        prismaMock.payment.update.mockResolvedValueOnce(
            successfulPayment as never
        );
        prismaMock.invoice.findFirst.mockResolvedValueOnce(
            invoiceWithSuccess as never
        );

        const response = await request(paymentApp())
            .patch(`/payments/${PAYMENT_ID}/status`)
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send({ status: PaymentStatus.SUCCESS });

        expect(response.status).toBe(200);
        expect(prismaMock.$transaction).toHaveBeenCalledWith(
            expect.any(Function),
            {
                isolationLevel:
                    Prisma.TransactionIsolationLevel.Serializable
            }
        );
        expect(prismaMock.payment.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    id: PAYMENT_ID,
                    status: PaymentStatus.PENDING,
                    invoice: {
                        contract: {
                            apartment: {
                                building_id: BUILDING_ID,
                                building: managerAssignment
                            }
                        }
                    }
                },
                data: expect.objectContaining({
                    status: PaymentStatus.SUCCESS
                })
            })
        );
        expect(prismaMock.staff.findUnique).not.toHaveBeenCalled();
    });

    it("re-reads successful totals in the transaction before accepting a status change", async () => {
        authenticateAs(Role.ADMIN);
        const otherPayment = {
            id: PAYMENT_ID + 1,
            invoice_id: INVOICE_ID,
            payment_method: "CASH",
            transaction_code: "TX-2",
            amount: 700,
            status: PaymentStatus.SUCCESS,
            paid_at: new Date("2030-01-04T00:00:00.000Z")
        };
        prismaMock.payment.findFirst.mockResolvedValueOnce(
            makePayment(
                PaymentStatus.PENDING,
                makeInvoice([otherPayment])
            ) as never
        );

        const response = await request(paymentApp())
            .patch(`/payments/${PAYMENT_ID}/status`)
            .set("Authorization", authorizationFor(Role.ADMIN))
            .send({ status: PaymentStatus.SUCCESS });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe("VALIDATION_ERROR");
        expect(prismaMock.$transaction).toHaveBeenCalledWith(
            expect.any(Function),
            {
                isolationLevel:
                    Prisma.TransactionIsolationLevel.Serializable
            }
        );
        expect(prismaMock.payment.update).not.toHaveBeenCalled();
    });

    it("maps exhausted serializable retries to a standard conflict", async () => {
        authenticateAs(Role.ADMIN);
        prismaMock.$transaction
            .mockRejectedValueOnce(prismaConflict("P2034"))
            .mockRejectedValueOnce(prismaConflict("P2034"))
            .mockRejectedValueOnce(prismaConflict("P2034"));

        const response = await request(paymentApp())
            .post("/payments")
            .set("Authorization", authorizationFor(Role.ADMIN))
            .send({
                invoice_id: INVOICE_ID,
                payment_method: "CASH",
                amount: 100,
                status: PaymentStatus.SUCCESS
            });

        expect(response.status).toBe(409);
        expect(response.body.error.code).toBe(
            "CONCURRENT_MODIFICATION"
        );
        expect(prismaMock.$transaction).toHaveBeenCalledTimes(3);
    });

    it("reports invoice scope loss when the final create connect fails", async () => {
        authenticateAs(Role.ADMIN);
        prismaMock.invoice.findFirst.mockResolvedValueOnce(
            makeInvoice() as never
        );
        prismaMock.payment.create.mockRejectedValueOnce(
            prismaConflict("P2025")
        );

        const response = await request(paymentApp())
            .post("/payments")
            .set("Authorization", authorizationFor(Role.ADMIN))
            .send({
                invoice_id: INVOICE_ID,
                payment_method: "CASH",
                amount: 100,
                status: PaymentStatus.SUCCESS
            });

        expect(response.status).toBe(404);
        expect(response.body.error).toEqual({
            code: "NOT_FOUND",
            message: "Invoice was not found"
        });
    });

    it("treats a final payment CAS miss as idempotent when the requested status won", async () => {
        authenticateAs(Role.ADMIN);
        const current = makePayment();
        const observed = makePayment(PaymentStatus.SUCCESS);
        prismaMock.payment.findFirst
            .mockResolvedValueOnce(current as never)
            .mockResolvedValueOnce(observed as never);
        prismaMock.payment.update.mockRejectedValueOnce(
            prismaConflict("P2025")
        );

        const response = await request(paymentApp())
            .patch(`/payments/${PAYMENT_ID}/status`)
            .set("Authorization", authorizationFor(Role.ADMIN))
            .send({ status: PaymentStatus.SUCCESS });

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            success: true,
            data: {
                id: PAYMENT_ID,
                status: PaymentStatus.SUCCESS
            }
        });
        expect(prismaMock.invoice.update).not.toHaveBeenCalled();
        expect(prismaMock.notification.create)
            .not.toHaveBeenCalled();
    });
});

describe("review API normalization and eligibility", () => {
    it("returns public reviews with exact pagination and rating metadata", async () => {
        const reviews = [{
            id: 1,
            apartment_id: APARTMENT_ID,
            tenant_id: TENANT_ID,
            rating: 4,
            comment: "Good",
            created_at: new Date("2030-01-01T00:00:00.000Z"),
            tenant: {
                id: TENANT_ID,
                full_name: "Tenant"
            }
        }];
        prismaMock.review.findMany.mockResolvedValueOnce(reviews as never);
        prismaMock.review.count.mockResolvedValueOnce(3);
        prismaMock.review.aggregate.mockResolvedValueOnce({
            _avg: { rating: 4.3 }
        } as never);

        const response = await request(reviewApp())
            .get(`/reviews/apartment/${APARTMENT_ID}?page=2&limit=1`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            success: true,
            data: [{
                ...reviews[0],
                created_at: reviews[0].created_at.toISOString()
            }],
            meta: {
                averageRating: 4.3,
                totalReviews: 3,
                pagination: {
                    total: 3,
                    page: 2,
                    limit: 1,
                    totalPages: 3
                }
            }
        });
    });

    it.each([
        [{
            apartment_id: true,
            rating: 5
        }],
        [{
            apartment_id: APARTMENT_ID,
            rating: 5.5
        }],
        [{
            apartment_id: APARTMENT_ID,
            rating: 5,
            comment: "x".repeat(2001)
        }],
        [{
            apartment_id: APARTMENT_ID,
            rating: 5,
            privileged: true
        }]
    ])("rejects invalid review input", async (body) => {
        authenticateAs(Role.TENANT);

        const response = await request(reviewApp())
            .post("/reviews")
            .set("Authorization", authorizationFor(Role.TENANT))
            .send(body);

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe("VALIDATION_ERROR");
        expect(prismaMock.review.create).not.toHaveBeenCalled();
    });

    it("carries Tenant identity and ended-contract eligibility into the final create", async () => {
        authenticateAs(Role.TENANT);
        const created = {
            id: 1,
            apartment_id: APARTMENT_ID,
            tenant_id: TENANT_ID,
            rating: 5,
            comment: "Excellent",
            created_at: new Date("2030-01-01T00:00:00.000Z")
        };
        prismaMock.review.create.mockResolvedValueOnce(created as never);

        const response = await request(reviewApp())
            .post("/reviews")
            .set("Authorization", authorizationFor(Role.TENANT))
            .send({
                apartment_id: APARTMENT_ID,
                rating: 5,
                comment: "Excellent"
            });

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
            success: true,
            data: {
                id: 1,
                tenant_id: TENANT_ID
            }
        });
        expect(prismaMock.tenant.findUnique).not.toHaveBeenCalled();
        expect(prismaMock.rentalContract.findFirst)
            .not.toHaveBeenCalled();
        expect(prismaMock.review.create).toHaveBeenCalledWith({
            data: {
                apartment: {
                    connect: {
                        id: APARTMENT_ID,
                        contracts: {
                            some: {
                                tenant_id: TENANT_ID,
                                status: ContractStatus.ENDED
                            }
                        }
                    }
                },
                tenant: {
                    connect: {
                        id: TENANT_ID,
                        user_id: TENANT_USER_ID
                    }
                },
                rating: 5,
                comment: "Excellent"
            }
        });
    });

    it("returns a standard 404 if ended-contract eligibility disappears at create", async () => {
        authenticateAs(Role.TENANT);
        prismaMock.review.create.mockRejectedValueOnce(
            prismaConflict("P2025")
        );

        const response = await request(reviewApp())
            .post("/reviews")
            .set("Authorization", authorizationFor(Role.TENANT))
            .send({
                apartment_id: APARTMENT_ID,
                rating: 5
            });

        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe("NOT_FOUND");
    });
});

describe("public chatbot envelope", () => {
    it("rejects an empty message through strict validation", async () => {
        const response = await request(chatbotApp())
            .post("/chat")
            .send({ message: "   " });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe("VALIDATION_ERROR");
        expect(chatbotMocks.processCustomerMessage)
            .not.toHaveBeenCalled();
    });

    it("trims a valid message and returns the standard envelope", async () => {
        chatbotMocks.processCustomerMessage.mockResolvedValueOnce({
            reply: "Hello"
        });

        const response = await request(chatbotApp())
            .post("/chat")
            .send({ message: "  Find an apartment  " });

        expect(response.status).toBe(200);
        expect(chatbotMocks.processCustomerMessage)
            .toHaveBeenCalledExactlyOnceWith("Find an apartment");
        expect(response.body).toEqual({
            success: true,
            data: {
                reply: "Hello"
            }
        });
    });
});

describe("standalone upload security and compensation", () => {
    it("authenticates before parsing malformed multipart data", async () => {
        const response = await request(uploadApp())
            .post("/uploads/upload-multiple")
            .set("Content-Type", "multipart/form-data")
            .send("not-valid-multipart");

        expect(response.status).toBe(401);
        expect(response.body.error.code).toBe(
            "AUTHENTICATION_REQUIRED"
        );
        expect(imageKitUploadMock).not.toHaveBeenCalled();
    });

    it("rejects an unassigned Manager before parsing multipart data", async () => {
        prismaMock.user.findUnique.mockResolvedValueOnce({
            id: MANAGER_USER_ID,
            role: Role.MANAGER,
            status: UserStatus.ACTIVE,
            staff: null,
            tenant: null
        } as never);

        const response = await request(uploadApp())
            .post("/uploads/upload-multiple")
            .set("Authorization", authorizationFor(Role.MANAGER))
            .set("Content-Type", "multipart/form-data")
            .send("not-valid-multipart");

        expect(response.status).toBe(403);
        expect(response.body.error.code).toBe(
            "MANAGER_BUILDING_REQUIRED"
        );
        expect(imageKitUploadMock).not.toHaveBeenCalled();
    });

    it("rejects a non-image MIME type before external upload", async () => {
        authenticateAs(Role.MANAGER);

        const response = await request(uploadApp())
            .post("/uploads/upload-multiple")
            .set("Authorization", authorizationFor(Role.MANAGER))
            .attach("images", Buffer.from("text"), {
                filename: "notes.txt",
                contentType: "text/plain"
            });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe("INVALID_FILE_TYPE");
        expect(imageKitUploadMock).not.toHaveBeenCalled();
    });

    it("returns a standard validation error when no files are supplied", async () => {
        authenticateAs(Role.ADMIN);

        const response = await request(uploadApp())
            .post("/uploads/upload-multiple")
            .set("Authorization", authorizationFor(Role.ADMIN))
            .send({});

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe("FILES_REQUIRED");
        expect(imageKitUploadMock).not.toHaveBeenCalled();
    });

    it("deletes earlier ImageKit files when a later upload fails", async () => {
        authenticateAs(Role.ADMIN);
        imageKitUploadMock
            .mockResolvedValueOnce({
                url: "https://images.example/first.jpg",
                fileId: "first-file"
            })
            .mockRejectedValueOnce(new Error("second upload failed"));
        imageKitDeleteFileMock.mockResolvedValueOnce(undefined);
        vi.spyOn(console, "error").mockImplementation(() => undefined);

        const response = await request(uploadApp())
            .post("/uploads/upload-multiple")
            .set("Authorization", authorizationFor(Role.ADMIN))
            .attach("images", jpegFixture("first"), {
                filename: "first.jpg",
                contentType: "image/jpeg"
            })
            .attach("images", pngFixture("second"), {
                filename: "second.png",
                contentType: "image/png"
            });

        expect(response.status).toBe(500);
        expect(imageKitDeleteFileMock)
            .toHaveBeenCalledExactlyOnceWith("first-file");
    });

    it("returns uploaded URLs without exposing ImageKit file identifiers", async () => {
        authenticateAs(Role.ADMIN);
        imageKitUploadMock.mockResolvedValueOnce({
            url: "https://images.example/one.webp",
            fileId: "private-file-id"
        });

        const response = await request(uploadApp())
            .post("/uploads/upload-multiple")
            .set("Authorization", authorizationFor(Role.ADMIN))
            .attach("images", webpFixture("image"), {
                filename: "one.webp",
                contentType: "image/webp"
            });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            success: true,
            data: {
                urls: ["https://images.example/one.webp"]
            }
        });
        expect(JSON.stringify(response.body)).not.toContain(
            "private-file-id"
        );
    });
});
