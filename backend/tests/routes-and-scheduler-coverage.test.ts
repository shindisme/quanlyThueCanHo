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
import {
    imageKitUploadMock,
    prismaMock
} from "./setup.js";

const chatbotMocks = vi.hoisted(() => ({
    processCustomerMessage: vi.fn()
}));

vi.mock("../src/services/chatbot.service.js", () => ({
    processCustomerMessage: chatbotMocks.processCustomerMessage
}));

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
    managerAssignments: {
        some: {
            staff_id: MANAGER_STAFF_ID,
            is_active: true,
            staff: {
                user_id: MANAGER_USER_ID
            }
        }
    }
};

const userIdFor = (role: Role) => {
    if (role === Role.ADMIN) {
        return ADMIN_USER_ID;
    }

    if (role === Role.TENANT) {
        return TENANT_USER_ID;
    }

    return MANAGER_USER_ID;
};

const authenticateAs = (role: Role) => {
    const id = userIdFor(role);

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

const authorizationFor = (role: Role) =>
    createBearerToken(userIdFor(role));

const paymentApp = () => createTestApp(
    paymentRouter,
    "/payments"
);
const reviewApp = () => createTestApp(reviewRouter, "/reviews");
const chatbotApp = () => createTestApp(chatbotRouter, "/chat");
const uploadApp = () => createTestApp(uploadRouter, "/uploads");

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

type PaymentRow = {
    id: number;
    invoice_id: number;
    payment_method: string;
    transaction_code: string | null;
    amount: number;
    status: PaymentStatus;
    paid_at: Date;
};

const makeInvoice = (
    payments: PaymentRow[] = [],
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
    invoice = makeInvoice(),
    amount = 600
) => ({
    id: PAYMENT_ID,
    invoice_id: INVOICE_ID,
    payment_method: "BANK_TRANSFER",
    transaction_code: "TX-1",
    amount,
    status,
    paid_at: new Date("2030-01-05T00:00:00.000Z"),
    invoice
});

const successfulPaymentRow = (): PaymentRow => ({
    id: PAYMENT_ID,
    invoice_id: INVOICE_ID,
    payment_method: "BANK_TRANSFER",
    transaction_code: "TX-1",
    amount: 1_000,
    status: PaymentStatus.SUCCESS,
    paid_at: new Date("2030-01-05T00:00:00.000Z")
});

const prismaConflict = (
    code: "P2002" | "P2025"
) => new Prisma.PrismaClientKnownRequestError(
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

describe("payment coverage gaps", () => {
    it("resolves /methods before /:id and returns its envelope", async () => {
        authenticateAs(Role.ADMIN);

        const response = await request(paymentApp())
            .get("/payments/methods")
            .set("Authorization", authorizationFor(Role.ADMIN));

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            success: true,
            data: [
                {
                    value: "CASH",
                    label: "Tien mat"
                },
                {
                    value: "BANK_TRANSFER",
                    label: "Chuyen khoan ngan hang"
                },
                {
                    value: "E_WALLET",
                    label: "Vi dien tu"
                }
            ]
        });
        expect(prismaMock.payment.findFirst).not.toHaveBeenCalled();
    });

    it("keeps the Admin payment list global", async () => {
        authenticateAs(Role.ADMIN);
        prismaMock.payment.findMany.mockResolvedValueOnce([]);
        prismaMock.payment.count.mockResolvedValueOnce(0);

        const response = await request(paymentApp())
            .get("/payments")
            .set("Authorization", authorizationFor(Role.ADMIN));

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            success: true,
            data: [],
            meta: {
                pagination: {
                    total: 0,
                    page: 1,
                    limit: 10,
                    totalPages: 0
                }
            }
        });
        expect(prismaMock.payment.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {}
            })
        );
        expect(prismaMock.payment.count).toHaveBeenCalledWith({
            where: {}
        });
    });

    it("rejects an explicit Tenant SUCCESS before a transaction", async () => {
        authenticateAs(Role.TENANT);

        const response = await request(paymentApp())
            .post("/payments")
            .set("Authorization", authorizationFor(Role.TENANT))
            .send({
                invoice_id: INVOICE_ID,
                payment_method: "CASH",
                amount: 100,
                status: PaymentStatus.SUCCESS
            });

        expect(response.status).toBe(403);
        expect(response.body.error.code).toBe("FORBIDDEN");
        expect(prismaMock.$transaction).not.toHaveBeenCalled();
        expect(prismaMock.invoice.findFirst).not.toHaveBeenCalled();
        expect(prismaMock.payment.create).not.toHaveBeenCalled();
    });

    it("defaults a Tenant create to final PENDING under invoice scope", async () => {
        authenticateAs(Role.TENANT);
        const invoice = makeInvoice();
        const created = makePayment(
            PaymentStatus.PENDING,
            invoice,
            100
        );

        prismaMock.invoice.findFirst
            .mockResolvedValueOnce(invoice as never)
            .mockResolvedValueOnce(invoice as never);
        prismaMock.payment.create.mockResolvedValueOnce(
            created as never
        );
        prismaMock.payment.findFirst.mockResolvedValueOnce(
            created as never
        );

        const response = await request(paymentApp())
            .post("/payments")
            .set("Authorization", authorizationFor(Role.TENANT))
            .send({
                invoice_id: INVOICE_ID,
                payment_method: "CASH",
                amount: 100
            });

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
            success: true,
            data: {
                invoice_id: INVOICE_ID,
                amount: 100,
                status: PaymentStatus.PENDING
            }
        });
        expect(prismaMock.payment.create).toHaveBeenCalledWith({
            data: {
                invoice: {
                    connect: {
                        id: INVOICE_ID,
                        tenant_id: TENANT_ID
                    }
                },
                payment_method: "CASH",
                transaction_code: undefined,
                amount: 100,
                status: PaymentStatus.PENDING
            }
        });
        expect(prismaMock.invoice.findFirst).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    id: INVOICE_ID,
                    tenant_id: TENANT_ID
                }
            })
        );
        expect(prismaMock.payment.findFirst).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    id: PAYMENT_ID,
                    invoice: {
                        tenant_id: TENANT_ID
                    }
                }
            })
        );
    });

    it("maps a duplicate transaction code to a payment conflict", async () => {
        authenticateAs(Role.ADMIN);
        prismaMock.invoice.findFirst.mockResolvedValueOnce(
            makeInvoice() as never
        );
        prismaMock.payment.create.mockRejectedValueOnce(
            prismaConflict("P2002")
        );

        const response = await request(paymentApp())
            .post("/payments")
            .set("Authorization", authorizationFor(Role.ADMIN))
            .send({
                invoice_id: INVOICE_ID,
                payment_method: "CASH",
                transaction_code: "TX-DUPLICATE",
                amount: 100
            });

        expect(response.status).toBe(409);
        expect(response.body.error).toEqual({
            code: "TRANSACTION_CODE_CONFLICT",
            message: "Transaction code already exists"
        });
    });

    it("notifies exactly once when the invoice PAID CAS wins", async () => {
        authenticateAs(Role.ADMIN);
        const current = makePayment(
            PaymentStatus.PENDING,
            makeInvoice(),
            1_000
        );
        const invoiceWithSuccess = makeInvoice([
            successfulPaymentRow()
        ]);
        const paidInvoice = makeInvoice(
            [successfulPaymentRow()],
            InvoiceStatus.PAID
        );
        const finalPayment = makePayment(
            PaymentStatus.SUCCESS,
            paidInvoice,
            1_000
        );

        prismaMock.payment.findFirst
            .mockResolvedValueOnce(current as never)
            .mockResolvedValueOnce(finalPayment as never);
        prismaMock.payment.update.mockResolvedValueOnce(
            finalPayment as never
        );
        prismaMock.invoice.findFirst.mockResolvedValueOnce(
            invoiceWithSuccess as never
        );
        prismaMock.invoice.update.mockResolvedValueOnce(
            paidInvoice as never
        );
        prismaMock.notification.create.mockResolvedValueOnce(
            {} as never
        );

        const response = await request(paymentApp())
            .patch(`/payments/${PAYMENT_ID}/status`)
            .set("Authorization", authorizationFor(Role.ADMIN))
            .send({ status: PaymentStatus.SUCCESS });

        expect(response.status).toBe(200);
        expect(prismaMock.invoice.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    id: INVOICE_ID,
                    status: InvoiceStatus.UNPAID
                },
                data: {
                    status: InvoiceStatus.PAID,
                    paid_at: expect.any(Date)
                }
            })
        );
        expect(prismaMock.notification.create).toHaveBeenCalledTimes(1);
        expect(prismaMock.notification.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                user_id: TENANT_USER_ID,
                type: "INVOICE_PAID"
            })
        });
    });

    it("does not duplicate notification when the invoice PAID CAS loses", async () => {
        authenticateAs(Role.ADMIN);
        const current = makePayment(
            PaymentStatus.PENDING,
            makeInvoice(),
            1_000
        );
        const invoiceWithSuccess = makeInvoice([
            successfulPaymentRow()
        ]);
        const paidInvoice = makeInvoice(
            [successfulPaymentRow()],
            InvoiceStatus.PAID
        );
        const finalPayment = makePayment(
            PaymentStatus.SUCCESS,
            paidInvoice,
            1_000
        );

        prismaMock.payment.findFirst
            .mockResolvedValueOnce(current as never)
            .mockResolvedValueOnce(finalPayment as never);
        prismaMock.payment.update.mockResolvedValueOnce(
            finalPayment as never
        );
        prismaMock.invoice.findFirst
            .mockResolvedValueOnce(invoiceWithSuccess as never)
            .mockResolvedValueOnce(paidInvoice as never);
        prismaMock.invoice.update.mockRejectedValueOnce(
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
        expect(prismaMock.invoice.update).toHaveBeenCalledTimes(1);
        expect(prismaMock.notification.create)
            .not.toHaveBeenCalled();
    });
});

describe("review coverage gaps", () => {
    it("rejects a Manager before attempting a review write", async () => {
        authenticateAs(Role.MANAGER);

        const response = await request(reviewApp())
            .post("/reviews")
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send({
                apartment_id: APARTMENT_ID,
                rating: 5
            });

        expect(response.status).toBe(403);
        expect(response.body.error.code).toBe("FORBIDDEN");
        expect(prismaMock.review.create).not.toHaveBeenCalled();
    });

    it("maps P2002 to REVIEW_ALREADY_EXISTS", async () => {
        authenticateAs(Role.TENANT);
        prismaMock.review.create.mockRejectedValueOnce(
            prismaConflict("P2002")
        );

        const response = await request(reviewApp())
            .post("/reviews")
            .set("Authorization", authorizationFor(Role.TENANT))
            .send({
                apartment_id: APARTMENT_ID,
                rating: 5
            });

        expect(response.status).toBe(409);
        expect(response.body.error).toEqual({
            code: "REVIEW_ALREADY_EXISTS",
            message: "This apartment has already been reviewed"
        });
    });
});

describe("chatbot coverage gaps", () => {
    it.each([
        [{ message: "Hello", unknown: true }],
        [{ message: "x".repeat(2_001) }]
    ])("rejects strict or oversized input", async (body) => {
        const response = await request(chatbotApp())
            .post("/chat")
            .send(body);

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe("VALIDATION_ERROR");
        expect(chatbotMocks.processCustomerMessage)
            .not.toHaveBeenCalled();
    });

    it("wraps a service rejection in the global error envelope", async () => {
        chatbotMocks.processCustomerMessage.mockRejectedValueOnce(
            new Error("chatbot unavailable")
        );
        vi.spyOn(console, "error").mockImplementation(
            () => undefined
        );

        const response = await request(chatbotApp())
            .post("/chat")
            .send({ message: "Find an apartment" });

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "An unexpected error occurred"
            }
        });
    });
});

describe("upload coverage gaps", () => {
    it("authorizes before parsing malformed multipart data", async () => {
        authenticateAs(Role.TENANT);

        const response = await request(uploadApp())
            .post("/uploads/upload-multiple")
            .set("Authorization", authorizationFor(Role.TENANT))
            .set("Content-Type", "multipart/form-data")
            .send("not-valid-multipart");

        expect(response.status).toBe(403);
        expect(response.body.error.code).toBe("FORBIDDEN");
        expect(imageKitUploadMock).not.toHaveBeenCalled();
    });

    it("returns UPLOAD_ERROR for an image over 5 MiB", async () => {
        authenticateAs(Role.ADMIN);
        const oversizedImage = Buffer.alloc(
            5 * 1024 * 1024 + 1
        );

        const response = await request(uploadApp())
            .post("/uploads/upload-multiple")
            .set("Authorization", authorizationFor(Role.ADMIN))
            .attach("images", oversizedImage, {
                filename: "too-large.jpg",
                contentType: "image/jpeg"
            });

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
            success: false,
            error: {
                code: "UPLOAD_ERROR",
                details: {
                    code: "LIMIT_FILE_SIZE",
                    field: "images"
                }
            }
        });
        expect(imageKitUploadMock).not.toHaveBeenCalled();
    });

    it("returns UPLOAD_ERROR when eleven images are supplied", async () => {
        authenticateAs(Role.ADMIN);
        let uploadRequest = request(uploadApp())
            .post("/uploads/upload-multiple")
            .set("Authorization", authorizationFor(Role.ADMIN));

        for (let index = 0; index < 11; index++) {
            uploadRequest = uploadRequest.attach(
                "images",
                Buffer.from([index]),
                {
                    filename: `image-${index}.jpg`,
                    contentType: "image/jpeg"
                }
            );
        }

        const response = await uploadRequest;

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
            success: false,
            error: {
                code: "UPLOAD_ERROR",
                details: {
                    code: "LIMIT_FILE_COUNT"
                }
            }
        });
        expect(imageKitUploadMock).not.toHaveBeenCalled();
    });
});
