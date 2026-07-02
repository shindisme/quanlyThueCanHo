import {
    Prisma,
    Role,
    UserStatus
} from "@prisma/client";
import request from "supertest";
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it
} from "vitest";
import { AppError } from "../src/errors/app-error.js";
import contractRouter from "../src/routes/contract.routes.js";
import invoiceRouter from "../src/routes/invoice.routes.js";
import {
    createContractRequestSchema
} from "../src/schemas/contract.schema.js";
import {
    generateMonthlyInvoicesRequestSchema
} from "../src/schemas/invoice.schema.js";
import {
    createContractService
} from "../src/services/contract.service.js";
import {
    generateMonthlyInvoicesService
} from "../src/services/invoice.service.js";
import type { Actor } from "../src/types/auth.js";
import {
    isDecimal12_2Amount,
    isNonNegativeDecimal12_2Amount
} from "../src/utils/money.js";
import { createBearerToken } from "./helpers/auth.js";
import { createTestApp } from "./helpers/test-app.js";
import { prismaMock } from "./setup.js";

const ADMIN_USER_ID = 901;
const APARTMENT_ID = 902;
const TENANT_ID = 903;
const MAX_MONEY = 9_999_999_999.99;

const adminActor: Actor = {
    userId: ADMIN_USER_ID,
    role: Role.ADMIN,
    status: UserStatus.ACTIVE
};

const validContractBody = {
    apartment_id: APARTMENT_ID,
    tenant_id: TENANT_ID,
    start_date: "2030-01-01",
    end_date: "2031-01-01",
    deposit_amount: 10_000_000.5,
    monthly_rent: 8_000_000.25,
    signed_at: "2029-12-20"
};

const validContractServiceInput = {
    ...validContractBody,
    start_date: new Date("2030-01-01T00:00:00.000Z"),
    end_date: new Date("2031-01-01T00:00:00.000Z"),
    signed_at: new Date("2029-12-20T00:00:00.000Z")
};

const validInvoiceBody = {
    month: 6,
    year: 2030,
    notify: false
};

const nonNumberJsonMoneyValues = [
    true,
    null,
    "",
    [1]
] as const;

const authenticateAdmin = () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
        id: ADMIN_USER_ID,
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
        staff: null,
        tenant: null
    } as never);
};

const contractApp = () =>
    createTestApp(contractRouter, "/contracts");
const invoiceApp = () =>
    createTestApp(invoiceRouter, "/invoices");
const adminAuthorization = () =>
    createBearerToken(ADMIN_USER_ID);

const expectValidationError = async (
    operation: Promise<unknown>
) => {
    try {
        await operation;
        throw new Error("Expected validation to reject");
    } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect(error).toMatchObject({
            statusCode: 400,
            code: "VALIDATION_ERROR"
        });
    }
};

const makeBillingContract = (
    monthlyRent: number,
    area = 1,
    id = 904,
    userId: number | null = null
) => ({
    id,
    apartment_id: APARTMENT_ID,
    tenant_id: TENANT_ID,
    start_date: new Date("2030-01-01T00:00:00.000Z"),
    end_date: new Date("2031-01-01T00:00:00.000Z"),
    deposit_amount: new Prisma.Decimal("1.00"),
    monthly_rent: new Prisma.Decimal(monthlyRent),
    status: "ACTIVE",
    contract_file: null,
    signed_at: new Date("2029-12-20T00:00:00.000Z"),
    created_at: new Date("2029-12-20T00:00:00.000Z"),
    extended_at: null,
    tenant: {
        id: TENANT_ID,
        full_name: "Tenant",
        user_id: userId
    },
    apartment: {
        id: APARTMENT_ID,
        building_id: 905,
        room_number: "A101",
        area: new Prisma.Decimal(area),
        building: {
            id: 905,
            branch_name: "Central"
        }
    }
});

const feeEnvKeys = [
    "INVOICE_MANAGEMENT_FEE",
    "INVOICE_MANAGEMENT_FEE_PER_M2",
    "INVOICE_ELECTRIC_UNIT_PRICE",
    "INVOICE_WATER_UNIT_PRICE",
    "INVOICE_INTERNET_FEE"
] as const;

beforeEach(() => {
    for (const key of feeEnvKeys) {
        delete process.env[key];
    }

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

afterEach(() => {
    for (const key of feeEnvKeys) {
        delete process.env[key];
    }
});

describe("Decimal(12,2) money utility", () => {
    it("accepts zero only for nonnegative money", () => {
        expect(isDecimal12_2Amount(0)).toBe(false);
        expect(isNonNegativeDecimal12_2Amount(0))
            .toBe(true);
    });

    it.each([
        0.001,
        MAX_MONEY + 0.01,
        Number.POSITIVE_INFINITY,
        Number.NaN
    ])("rejects invalid nonnegative money %s", (value) => {
        expect(isNonNegativeDecimal12_2Amount(value))
            .toBe(false);
    });
});

describe("contract money validation", () => {
    it.each(
        [
            "deposit_amount",
            "monthly_rent"
        ].flatMap((field) =>
            nonNumberJsonMoneyValues.map((value) =>
                [field, value] as const
            )
        )
    )(
        "rejects non-number JSON money value %s=%j",
        (field, value) => {
            const result = createContractRequestSchema.safeParse({
                params: {},
                query: {},
                body: {
                    ...validContractBody,
                    [field]: value
                }
            });

            expect(result.success).toBe(false);
        }
    );

    it.each([
        ["deposit_amount", 0],
        ["deposit_amount", 0.001],
        ["deposit_amount", MAX_MONEY + 0.01],
        ["monthly_rent", 0],
        ["monthly_rent", 0.001],
        ["monthly_rent", MAX_MONEY + 0.01]
    ] as const)(
        "rejects %s=%s at the request schema with standard 400",
        async (field, value) => {
            authenticateAdmin();

            const response = await request(contractApp())
                .post("/contracts")
                .set("Authorization", adminAuthorization())
                .send({
                    ...validContractBody,
                    [field]: value
                });

            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe(
                "VALIDATION_ERROR"
            );
            expect(prismaMock.$transaction).not.toHaveBeenCalled();
        }
    );

    it("accepts the positive Decimal(12,2) maximum at the schema", () => {
        const result = createContractRequestSchema.safeParse({
            params: {},
            query: {},
            body: {
                ...validContractBody,
                deposit_amount: MAX_MONEY,
                monthly_rent: MAX_MONEY
            }
        });

        expect(result.success).toBe(true);
    });

    it.each([
        ["deposit_amount", 0],
        ["deposit_amount", 0.001],
        ["deposit_amount", MAX_MONEY + 0.01],
        ["monthly_rent", 0],
        ["monthly_rent", 0.001],
        ["monthly_rent", MAX_MONEY + 0.01]
    ] as const)(
        "rejects direct service input %s=%s before Prisma",
        async (field, value) => {
            await expectValidationError(
                createContractService({
                    ...validContractServiceInput,
                    [field]: value
                }, adminActor)
            );

            expect(prismaMock.$transaction).not.toHaveBeenCalled();
        }
    );
});

describe("invoice money validation", () => {
    const invalidFees = [
        "management_fee",
        "management_fee_per_m2",
        "electric_unit_price",
        "water_unit_price",
        "internet_fee"
    ].flatMap((field) => [
        [field, -0.01],
        [field, 0.001],
        [field, MAX_MONEY + 0.01]
    ]) as Array<[string, number]>;

    it.each(
        [
            "management_fee",
            "management_fee_per_m2",
            "electric_unit_price",
            "water_unit_price",
            "internet_fee"
        ].flatMap((field) =>
            nonNumberJsonMoneyValues.map((value) =>
                [field, value] as const
            )
        )
    )(
        "rejects non-number JSON money value %s=%j",
        (field, value) => {
            const result =
                generateMonthlyInvoicesRequestSchema.safeParse({
                    params: {},
                    query: {},
                    body: {
                        ...validInvoiceBody,
                        [field]: value
                    }
                });

            expect(result.success).toBe(false);
        }
    );

    it.each(invalidFees)(
        "rejects %s=%s at the request schema with standard 400",
        async (field, value) => {
            authenticateAdmin();

            const response = await request(invoiceApp())
                .post("/invoices/generate-monthly")
                .set("Authorization", adminAuthorization())
                .send({
                    ...validInvoiceBody,
                    [field]: value
                });

            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe(
                "VALIDATION_ERROR"
            );
            expect(prismaMock.rentalContract.findMany)
                .not.toHaveBeenCalled();
        }
    );

    it("accepts zero and the Decimal(12,2) maximum for fees", () => {
        const result =
            generateMonthlyInvoicesRequestSchema.safeParse({
                params: {},
                query: {},
                body: {
                    ...validInvoiceBody,
                    management_fee: 0,
                    management_fee_per_m2: MAX_MONEY,
                    electric_unit_price: 0,
                    water_unit_price: MAX_MONEY,
                    internet_fee: 0
                }
            });

        expect(result.success).toBe(true);
    });

    it.each([
        ["management_fee", -0.01],
        ["management_fee_per_m2", 0.001],
        ["electric_unit_price", MAX_MONEY + 0.01]
    ] as const)(
        "rejects direct service config %s=%s before Prisma",
        async (field, value) => {
            await expectValidationError(
                generateMonthlyInvoicesService({
                    ...validInvoiceBody,
                    [field]: value
                } as never, adminActor)
            );

            expect(prismaMock.rentalContract.findMany)
                .not.toHaveBeenCalled();
        }
    );

    it.each([
        ["0.001", "fractional cents"],
        [String(MAX_MONEY + 0.01), "Decimal(12,2) overflow"],
        ["not-a-number", "non-numeric value"]
    ])(
        "rejects environment fee config %s (%s) as 400",
        async (value) => {
            process.env.INVOICE_MANAGEMENT_FEE = value;

            await expectValidationError(
                generateMonthlyInvoicesService(
                    validInvoiceBody,
                    adminActor
                )
            );

            expect(prismaMock.rentalContract.findMany)
                .not.toHaveBeenCalled();
        }
    );

    it("rejects a calculated invoice item overflow before write", async () => {
        prismaMock.rentalContract.findMany.mockResolvedValueOnce([
            makeBillingContract(1, 2)
        ] as never);
        prismaMock.invoice.findUnique.mockResolvedValueOnce(null);
        prismaMock.utilityReading.findFirst.mockResolvedValueOnce(null);

        await expectValidationError(
            generateMonthlyInvoicesService({
                ...validInvoiceBody,
                management_fee_per_m2: MAX_MONEY
            }, adminActor)
        );

        expect(prismaMock.invoice.create).not.toHaveBeenCalled();
    });

    it("rejects a calculated invoice total overflow before write", async () => {
        prismaMock.rentalContract.findMany.mockResolvedValueOnce([
            makeBillingContract(MAX_MONEY)
        ] as never);
        prismaMock.invoice.findUnique.mockResolvedValueOnce(null);
        prismaMock.utilityReading.findFirst.mockResolvedValueOnce(null);

        await expectValidationError(
            generateMonthlyInvoicesService({
                ...validInvoiceBody,
                internet_fee: 0.01
            }, adminActor)
        );

        expect(prismaMock.invoice.create).not.toHaveBeenCalled();
    });

    it("rounds exact decimal multiplication half up to two places", async () => {
        const stopAfterInspectingWrite = new Error(
            "stop after inspecting invoice write"
        );
        prismaMock.rentalContract.findMany.mockResolvedValueOnce([
            makeBillingContract(0, 30.02)
        ] as never);
        prismaMock.invoice.findUnique.mockResolvedValueOnce(null);
        prismaMock.utilityReading.findFirst.mockResolvedValueOnce(null);
        prismaMock.invoice.create.mockRejectedValueOnce(
            stopAfterInspectingWrite
        );

        await expect(
            generateMonthlyInvoicesService({
                ...validInvoiceBody,
                management_fee_per_m2: 1092.75
            }, adminActor)
        ).rejects.toBe(stopAfterInspectingWrite);

        expect(prismaMock.invoice.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    total_amount: 32_804.36,
                    items: {
                        create: expect.arrayContaining([
                            expect.objectContaining({
                                item_name: "Phi quan ly 06/2030",
                                unit_price: 32_804.36,
                                amount: 32_804.36
                            })
                        ])
                    }
                })
            })
        );
    });

    it("rejects an exact half-cent Decimal(12,2) overflow before write", async () => {
        const unexpectedWrite = new Error("invoice write attempted");
        prismaMock.rentalContract.findMany.mockResolvedValueOnce([
            makeBillingContract(0, 38.33)
        ] as never);
        prismaMock.invoice.findUnique.mockResolvedValueOnce(null);
        prismaMock.utilityReading.findFirst.mockResolvedValueOnce(null);
        prismaMock.invoice.create.mockRejectedValueOnce(unexpectedWrite);

        await expectValidationError(
            generateMonthlyInvoicesService({
                ...validInvoiceBody,
                management_fee_per_m2: 260_892_251.5
            }, adminActor)
        );

        expect(prismaMock.invoice.create).not.toHaveBeenCalled();
    });

    it("validates the complete batch before the first invoice write", async () => {
        prismaMock.rentalContract.findMany.mockResolvedValueOnce([
            makeBillingContract(1, 1, 904, 906),
            makeBillingContract(MAX_MONEY, 1, 905, 907)
        ] as never);
        prismaMock.invoice.findUnique
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null);
        prismaMock.utilityReading.findFirst
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null);
        prismaMock.invoice.create.mockResolvedValueOnce({
            contract: {
                tenant: {
                    user_id: 906
                }
            }
        } as never);
        prismaMock.notification.create.mockResolvedValueOnce(
            {} as never
        );

        await expectValidationError(
            generateMonthlyInvoicesService({
                ...validInvoiceBody,
                internet_fee: 0.01,
                notify: true
            }, adminActor)
        );

        expect(prismaMock.invoice.create).not.toHaveBeenCalled();
        expect(prismaMock.invoiceItem.create).not.toHaveBeenCalled();
        expect(prismaMock.invoiceItem.createMany).not.toHaveBeenCalled();
        expect(prismaMock.notification.create).not.toHaveBeenCalled();
    });
});
