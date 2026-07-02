import {
    InvoiceStatus,
    PaymentStatus,
    Prisma,
    Role
} from "@prisma/client";
import { prisma } from "../config/database.js";
import { AppError } from "../errors/app-error.js";
import type {
    GenerateMonthlyInvoicesRequest,
    ListInvoicesRequest
} from "../schemas/invoice.schema.js";
import type { Actor } from "../types/auth.js";
import {
    isNonNegativeDecimal12_2Amount,
    MAX_DECIMAL_12_2
} from "../utils/money.js";
import { getCurrentManagerAssignment } from "./manager-scope.js";

export type InvoiceActor = Actor;
export type InvoiceFilters = ListInvoicesRequest["query"];
export type MonthlyInvoiceInput =
    GenerateMonthlyInvoicesRequest["body"];

export class InvoiceError extends AppError {
    constructor(message: string, statusCode = 400) {
        super(
            statusCode,
            statusCode === 404
                ? "NOT_FOUND"
                : statusCode === 403
                    ? "FORBIDDEN"
                    : statusCode === 500
                        ? "INVOICE_CONFIGURATION_ERROR"
                        : "VALIDATION_ERROR",
            message
        );
    }
}

const invoiceInclude = {
    contract: {
        include: {
            tenant: {
                select: {
                    id: true,
                    full_name: true,
                    phone: true,
                    email: true,
                    user_id: true,
                    user: {
                        select: {
                            id: true,
                            username: true,
                            role: true
                        }
                    }
                }
            },
            apartment: {
                select: {
                    id: true,
                    building_id: true,
                    floor: true,
                    room_number: true,
                    area: true,
                    rental_price: true,
                    building: {
                        select: {
                            id: true,
                            branch_name: true,
                            address_new: true
                        }
                    }
                }
            }
        }
    },
    items: {
        orderBy: { id: "asc" }
    },
    payments: {
        orderBy: { paid_at: "desc" }
    }
} satisfies Prisma.InvoiceInclude;

type InvoiceWithRelations = Prisma.InvoiceGetPayload<{
    include: typeof invoiceInclude;
}>;

type ContractForBilling = Prisma.RentalContractGetPayload<{
    include: {
        tenant: {
            select: {
                id: true;
                full_name: true;
                user_id: true;
            };
        };
        apartment: {
            select: {
                id: true;
                building_id: true;
                room_number: true;
                area: true;
                building: {
                    select: {
                        id: true;
                        branch_name: true;
                    };
                };
            };
        };
    };
}>;

type MonthlyInvoiceItem = {
    item_name: string;
    quantity: number;
    unit_price: number;
    amount: number;
};

type PlannedMonthlyInvoice = {
    contract: ContractForBilling;
    invoiceCode: string;
    items: MonthlyInvoiceItem[];
    totalAmount: number;
};

const padMonth = (month: number) => month.toString().padStart(2, "0");

const toNumber = (value: Prisma.Decimal | number) => Number(value);

const roundDecimalMoney = (
    value: Prisma.Decimal
) => value.toDecimalPlaces(
    2,
    Prisma.Decimal.ROUND_HALF_UP
);

const roundMoney = (
    value: Prisma.Decimal | number | string
) => roundDecimalMoney(
    new Prisma.Decimal(value)
).toNumber();

const assertNonNegativeMoney = (
    value: number,
    label: string
) => {
    if (!isNonNegativeDecimal12_2Amount(value)) {
        throw new InvoiceError(
            `${label} phai la so khong am, nam trong Decimal(12,2) va co toi da hai chu so thap phan.`
        );
    }
};

const assertNonNegativeDecimalMoney = (
    value: Prisma.Decimal,
    label: string
) => {
    if (
        !value.isFinite()
        || value.isNegative()
        || value.decimalPlaces() > 2
        || value.greaterThan(MAX_DECIMAL_12_2)
    ) {
        throw new InvoiceError(
            `${label} phai la so khong am, nam trong Decimal(12,2) va co toi da hai chu so thap phan.`
        );
    }
};

const assertValidMonthYear = (month: number, year: number) => {
    if (!Number.isInteger(month) || month < 1 || month > 12) {
        throw new InvoiceError("Thang hoa don khong hop le.");
    }

    if (!Number.isInteger(year) || year < 2000 || year > 3000) {
        throw new InvoiceError("Nam hoa don khong hop le.");
    }
};

const getEnvNumber = (
    key: string,
    fallback: number,
    invalidStatusCode = 500
) => {
    const value = process.env[key];
    if (value === undefined || value === "") {
        return fallback;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        throw new InvoiceError(
            `Cau hinh ${key} khong hop le.`,
            invalidStatusCode
        );
    }

    return parsed;
};

const getFeeConfig = (input: MonthlyInvoiceInput) => {
    const config = {
        managementFee: input.management_fee ?? getEnvNumber("INVOICE_MANAGEMENT_FEE", 0, 400),
        managementFeePerM2: input.management_fee_per_m2 ?? getEnvNumber("INVOICE_MANAGEMENT_FEE_PER_M2", 0, 400),
        electricUnitPrice: input.electric_unit_price ?? getEnvNumber("INVOICE_ELECTRIC_UNIT_PRICE", 0, 400),
        waterUnitPrice: input.water_unit_price ?? getEnvNumber("INVOICE_WATER_UNIT_PRICE", 0, 400),
        internetFee: input.internet_fee ?? getEnvNumber("INVOICE_INTERNET_FEE", 0, 400)
    };

    assertNonNegativeMoney(config.managementFee, "Phi quan ly");
    assertNonNegativeMoney(config.managementFeePerM2, "Phi quan ly theo m2");
    assertNonNegativeMoney(config.electricUnitPrice, "Don gia dien");
    assertNonNegativeMoney(config.waterUnitPrice, "Don gia nuoc");
    assertNonNegativeMoney(config.internetFee, "Phi internet");

    return config;
};

const getPreviousBillingPeriod = (date = new Date()) => {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric",
        month: "2-digit"
    }).formatToParts(date);

    const year = Number(parts.find((part) => part.type === "year")?.value);
    const month = Number(parts.find((part) => part.type === "month")?.value);
    const previous = new Date(Date.UTC(year, month - 2, 1));

    return {
        month: previous.getUTCMonth() + 1,
        year: previous.getUTCFullYear()
    };
};

const resolveBillingPeriod = (input: MonthlyInvoiceInput) => {
    if (input.month === undefined && input.year === undefined) {
        return getPreviousBillingPeriod();
    }

    if (input.month === undefined || input.year === undefined) {
        throw new InvoiceError("Can nhap day du month va year.");
    }

    assertValidMonthYear(input.month, input.year);

    return {
        month: input.month,
        year: input.year
    };
};

const getDefaultDueDate = (month: number, year: number) => {
    const dueDay = Math.min(28, Math.max(1, Math.trunc(getEnvNumber("INVOICE_DUE_DAY", 10))));
    return new Date(Date.UTC(year, month, dueDay, 16, 59, 59, 999));
};

const resolveDueDate = (input: MonthlyInvoiceInput, month: number, year: number) => {
    if (!input.due_date) {
        return getDefaultDueDate(month, year);
    }

    return new Date(input.due_date.getTime());
};

const buildMonthlyInvoiceCode = (contractId: number, month: number, year: number) =>
    `INV-${contractId}-${year}${padMonth(month)}`;

const normalizeInvoice = (invoice: InvoiceWithRelations) => {
    const { payments, ...invoiceData } = invoice;
    const totalAmount = toNumber(invoice.total_amount);
    const paidAmount = payments
        .filter((payment) => payment.status === PaymentStatus.SUCCESS)
        .reduce((sum, payment) => sum + toNumber(payment.amount), 0);

    return {
        ...invoiceData,
        total_amount: totalAmount,
        paid_amount: roundMoney(paidAmount),
        remaining_amount: roundMoney(Math.max(totalAmount - paidAmount, 0)),
        contract: {
            ...invoice.contract,
            deposit_amount: toNumber(invoice.contract.deposit_amount),
            monthly_rent: toNumber(invoice.contract.monthly_rent),
            apartment: {
                ...invoice.contract.apartment,
                area: toNumber(invoice.contract.apartment.area),
                rental_price: toNumber(invoice.contract.apartment.rental_price)
            }
        },
        items: invoice.items.map((item) => ({
            ...item,
            quantity: toNumber(item.quantity),
            unit_price: toNumber(item.unit_price),
            amount: toNumber(item.amount)
        }))
    };
};

const getManagerApartmentScope = (actor: InvoiceActor) => {
    const assignment = getCurrentManagerAssignment(actor);

    return {
        building_id: assignment.buildingId,
        building: assignment.assignmentWhere
    } satisfies Prisma.ApartmentWhereInput;
};

const requireTenantId = (actor: InvoiceActor) => {
    if (actor.tenantId === undefined) {
        throw new InvoiceError(
            "Tai khoan chua duoc lien ket voi ho so nguoi thue.",
            403
        );
    }

    return actor.tenantId;
};

const getInvoiceScopeWhere = (
    actor: InvoiceActor
): Prisma.InvoiceWhereInput => {
    if (actor.role === Role.ADMIN) {
        return {};
    }

    if (actor.role === Role.MANAGER) {
        return {
            contract: {
                apartment: getManagerApartmentScope(actor)
            }
        };
    }

    if (actor.role === Role.TENANT) {
        return {
            tenant_id: requireTenantId(actor)
        };
    }

    throw new InvoiceError("Ban khong co quyen truy cap hoa don.", 403);
};

const getInvoiceByIdOrThrow = async (
    id: number,
    actor: InvoiceActor
) => {
    const scope = getInvoiceScopeWhere(actor);
    const invoice = actor.role === Role.ADMIN
        ? await prisma.invoice.findUnique({
            where: { id },
            include: invoiceInclude
        })
        : await prisma.invoice.findFirst({
            where: {
                id,
                ...scope
            },
            include: invoiceInclude
        });

    if (!invoice) {
        throw new InvoiceError("Hoa don khong ton tai.", 404);
    }

    return invoice;
};

const assertCanManageInvoices = (actor: InvoiceActor) => {
    if (
        actor.role !== Role.ADMIN
        && actor.role !== Role.MANAGER
    ) {
        throw new InvoiceError("Ban khong co quyen quan ly hoa don.", 403);
    }
};

const assertValidInvoiceStatus = (status: unknown): status is InvoiceStatus => {
    return status === InvoiceStatus.PAID || status === InvoiceStatus.UNPAID;
};

const getPaymentTotal = (invoice: Pick<InvoiceWithRelations, "payments">) => {
    return invoice.payments
        .filter((payment) => payment.status === PaymentStatus.SUCCESS)
        .reduce((sum, payment) => sum + toNumber(payment.amount), 0);
};

const createInvoiceNotification = async (
    tx: Prisma.TransactionClient,
    invoice: InvoiceWithRelations,
    title: string,
    content: string,
    type: string
) => {
    const userId = invoice.contract.tenant.user_id;
    if (!userId) {
        return;
    }

    await tx.notification.create({
        data: {
            user_id: userId,
            title,
            content,
            type
        }
    });
};

export const getInvoicesService = async (filters: InvoiceFilters, actor: InvoiceActor) => {
    const page = filters.page;
    const limit = filters.limit;
    const skip = (page - 1) * limit;

    const scope = getInvoiceScopeWhere(actor);
    const andFilters: Prisma.InvoiceWhereInput[] =
        actor.role === Role.ADMIN ? [] : [scope];

    if (filters.status) {
        andFilters.push({ status: filters.status });
    }

    if (
        actor.role !== Role.TENANT
        && filters.tenant_id !== undefined
    ) {
        andFilters.push({ tenant_id: filters.tenant_id });
    }

    if (
        actor.role !== Role.TENANT
        && filters.contract_id !== undefined
    ) {
        andFilters.push({ contract_id: filters.contract_id });
    }

    if (
        actor.role !== Role.TENANT
        && filters.apartment_id !== undefined
    ) {
        andFilters.push({
            contract: {
                apartment_id: filters.apartment_id
            }
        });
    }

    if (
        actor.role === Role.ADMIN
        && filters.building_id !== undefined
    ) {
        andFilters.push({
            contract: {
                apartment: {
                    building_id: filters.building_id
                }
            }
        });
    }

    if (
        filters.month !== undefined
        && filters.year !== undefined
    ) {
        andFilters.push({
            invoice_code: {
                contains: `-${filters.year}${padMonth(filters.month)}`
            }
        });
    }

    if (filters.search) {
        andFilters.push({
            OR: [
                { invoice_code: { contains: filters.search, mode: "insensitive" } },
                { contract: { tenant: { full_name: { contains: filters.search, mode: "insensitive" } } } },
                { contract: { apartment: { room_number: { contains: filters.search, mode: "insensitive" } } } },
                { contract: { apartment: { building: { branch_name: { contains: filters.search, mode: "insensitive" } } } } }
            ]
        });
    }

    const whereClause: Prisma.InvoiceWhereInput =
        andFilters.length === 0
            ? {}
            : { AND: andFilters };

    const [invoices, total] = await prisma.$transaction([
        prisma.invoice.findMany({
            where: whereClause,
            skip,
            take: limit,
            orderBy: { created_at: "desc" },
            include: invoiceInclude
        }),
        prisma.invoice.count({ where: whereClause })
    ]);

    return {
        data: invoices.map(normalizeInvoice),
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
};

export const getInvoiceByIdService = async (id: number, actor: InvoiceActor) => {
    const invoice = await getInvoiceByIdOrThrow(id, actor);
    return normalizeInvoice(invoice);
};

export const generateMonthlyInvoicesService = async (
    input: MonthlyInvoiceInput,
    actor?: InvoiceActor
) => {
    if (actor) {
        assertCanManageInvoices(actor);
    }

    const { month, year } = resolveBillingPeriod(input);
    const dueDate = resolveDueDate(input, month, year);
    const feeConfig = getFeeConfig(input);
    const notify = input.notify !== false;

    const managerApartmentScope =
        actor?.role === Role.MANAGER
            ? getManagerApartmentScope(actor)
            : undefined;
    const buildingId = managerApartmentScope
        ? undefined
        : input.building_id;

    const periodStart = new Date(Date.UTC(year, month - 1, 1));
    const periodEnd = new Date(Date.UTC(year, month, 1));

    const contracts = await prisma.rentalContract.findMany({
        where: {
            status: "ACTIVE",
            start_date: { lt: periodEnd },
            end_date: { gte: periodStart },
            ...(managerApartmentScope
                ? {
                    apartment: managerApartmentScope
                }
                : buildingId
                ? {
                    apartment: {
                        building_id: buildingId
                    }
                }
                : {})
        },
        include: {
            tenant: {
                select: {
                    id: true,
                    full_name: true,
                    user_id: true
                }
            },
            apartment: {
                select: {
                    id: true,
                    building_id: true,
                    room_number: true,
                    area: true,
                    building: {
                        select: {
                            id: true,
                            branch_name: true
                        }
                    }
                }
            }
        }
    });

    const created: InvoiceWithRelations[] = [];
    const skipped: Array<{ contract_id: number; invoice_code: string; reason: string }> = [];
    const missingUtilityReadings: Array<{ apartment_id: number; room_number: string; contract_id: number }> = [];
    const plannedInvoices: PlannedMonthlyInvoice[] = [];

    for (const contract of contracts) {
        const invoiceCode = buildMonthlyInvoiceCode(contract.id, month, year);
        const existing = await prisma.invoice.findUnique({
            where: { invoice_code: invoiceCode }
        });

        if (existing) {
            skipped.push({
                contract_id: contract.id,
                invoice_code: invoiceCode,
                reason: "Hoa don thang nay da ton tai."
            });
            continue;
        }

        const reading = await prisma.utilityReading.findFirst({
            where: {
                apartment_id: contract.apartment_id,
                month,
                year
            }
        });

        const electricConsumption = reading
            ? nonNegativeDecimalDifference(
                reading.electric_new,
                reading.electric_old
            )
            : new Prisma.Decimal(0);
        const waterConsumption = reading
            ? nonNegativeDecimalDifference(
                reading.water_new,
                reading.water_old
            )
            : new Prisma.Decimal(0);

        if (!reading) {
            missingUtilityReadings.push({
                apartment_id: contract.apartment_id,
                room_number: contract.apartment.room_number,
                contract_id: contract.id
            });
        }

        const items = buildMonthlyItems(contract, {
            month,
            year,
            electricConsumption,
            waterConsumption,
            feeConfig
        });
        const totalAmountDecimal = roundDecimalMoney(
            items.reduce(
                (sum, item) => {
                    const itemAmount =
                        new Prisma.Decimal(item.amount);

                    assertNonNegativeDecimalMoney(
                        itemAmount,
                        item.item_name
                    );
                    assertNonNegativeMoney(
                        item.amount,
                        item.item_name
                    );

                    return sum.plus(itemAmount);
                },
                new Prisma.Decimal(0)
            )
        );

        assertNonNegativeDecimalMoney(
            totalAmountDecimal,
            "Tong tien hoa don"
        );

        const totalAmount = totalAmountDecimal.toNumber();
        assertNonNegativeMoney(
            totalAmount,
            "Tong tien hoa don"
        );

        plannedInvoices.push({
            contract,
            invoiceCode,
            items,
            totalAmount
        });
    }

    for (const {
        contract,
        invoiceCode,
        items,
        totalAmount
    } of plannedInvoices) {
        try {
            const invoice = await prisma.$transaction(async (tx) => {
                const invoiceData = {
                    invoice_code: invoiceCode,
                    due_date: dueDate,
                    total_amount: totalAmount,
                    status: InvoiceStatus.UNPAID,
                    items: {
                        create: items
                    }
                };
                const createData: Prisma.InvoiceCreateInput = {
                    ...invoiceData,
                    tenant: {
                        connect: { id: contract.tenant_id }
                    },
                    contract: {
                        connect: managerApartmentScope
                            ? {
                                id: contract.id,
                                apartment: managerApartmentScope
                            }
                            : { id: contract.id }
                    }
                };
                const newInvoice = await tx.invoice.create({
                    data: createData,
                    include: invoiceInclude
                });

                if (notify) {
                    await createInvoiceNotification(
                        tx,
                        newInvoice,
                        "Hoa don moi",
                        `Hoa don ${invoiceCode} da duoc tao voi tong tien ${totalAmount}.`,
                        "INVOICE_CREATED"
                    );
                }

                return newInvoice;
            });

            created.push(invoice);
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
                skipped.push({
                    contract_id: contract.id,
                    invoice_code: invoiceCode,
                    reason: "Hoa don thang nay da ton tai."
                });
                continue;
            }

            throw error;
        }
    }

    return {
        month,
        year,
        due_date: dueDate,
        total_contracts: contracts.length,
        created_count: created.length,
        skipped_count: skipped.length,
        missing_utility_reading_count: missingUtilityReadings.length,
        invoices: created.map(normalizeInvoice),
        skipped,
        missing_utility_readings: missingUtilityReadings
    };
};

const nonNegativeDecimalDifference = (
    newer: Prisma.Decimal,
    older: Prisma.Decimal
) => {
    const difference = new Prisma.Decimal(newer).minus(older);

    return difference.isNegative()
        ? new Prisma.Decimal(0)
        : difference;
};

const buildMonthlyItems = (
    contract: ContractForBilling,
    options: {
        month: number;
        year: number;
        electricConsumption: Prisma.Decimal;
        waterConsumption: Prisma.Decimal;
        feeConfig: ReturnType<typeof getFeeConfig>;
    }
): MonthlyInvoiceItem[] => {
    const periodLabel = `${padMonth(options.month)}/${options.year}`;
    const rentAmount = roundDecimalMoney(
        new Prisma.Decimal(contract.monthly_rent)
    ).toNumber();
    const managementAmount = roundDecimalMoney(
        new Prisma.Decimal(options.feeConfig.managementFee).plus(
            new Prisma.Decimal(contract.apartment.area).mul(
                options.feeConfig.managementFeePerM2
            )
        )
    ).toNumber();
    const electricAmount = roundDecimalMoney(
        options.electricConsumption.mul(
            options.feeConfig.electricUnitPrice
        )
    ).toNumber();
    const waterAmount = roundDecimalMoney(
        options.waterConsumption.mul(
            options.feeConfig.waterUnitPrice
        )
    ).toNumber();
    const internetAmount = roundDecimalMoney(
        new Prisma.Decimal(options.feeConfig.internetFee)
    ).toNumber();

    return [
        {
            item_name: `Phi thue can ho ${periodLabel}`,
            quantity: 1,
            unit_price: rentAmount,
            amount: rentAmount
        },
        {
            item_name: `Phi quan ly ${periodLabel}`,
            quantity: 1,
            unit_price: managementAmount,
            amount: managementAmount
        },
        {
            item_name: `Tien dien ${periodLabel}`,
            quantity: roundMoney(options.electricConsumption),
            unit_price: options.feeConfig.electricUnitPrice,
            amount: electricAmount
        },
        {
            item_name: `Tien nuoc ${periodLabel}`,
            quantity: roundMoney(options.waterConsumption),
            unit_price: options.feeConfig.waterUnitPrice,
            amount: waterAmount
        },
        {
            item_name: `Phi internet ${periodLabel}`,
            quantity: 1,
            unit_price: internetAmount,
            amount: internetAmount
        }
    ];
};

export const updateInvoiceStatusService = async (
    id: number,
    status: InvoiceStatus,
    actor: InvoiceActor
) => {
    assertCanManageInvoices(actor);
    if (!assertValidInvoiceStatus(status)) {
        throw new InvoiceError("Trang thai hoa don khong hop le.");
    }

    const scope = getInvoiceScopeWhere(actor);
    const scopedWhere: Prisma.InvoiceWhereInput = {
        id,
        ...scope
    };

    const invoice = await prisma.$transaction(async (tx) => {
        const current = await tx.invoice.findFirst({
            where: scopedWhere,
            include: invoiceInclude
        });

        if (!current) {
            throw new InvoiceError("Hoa don khong ton tai.", 404);
        }

        if (current.status === status) {
            return current;
        }

        const result = await tx.invoice.updateMany({
            where: {
                ...scopedWhere,
                status: current.status
            },
            data: {
                status,
                paid_at: status === InvoiceStatus.PAID ? new Date() : null
            }
        });

        if (result.count === 0) {
            const observed = await tx.invoice.findFirst({
                where: scopedWhere,
                include: invoiceInclude
            });

            if (!observed) {
                throw new InvoiceError(
                    "Hoa don khong ton tai.",
                    404
                );
            }

            if (observed.status === status) {
                return observed;
            }

            throw new AppError(
                409,
                "CONCURRENT_MODIFICATION",
                "Invoice status changed during this operation"
            );
        }

        const updated = await tx.invoice.findFirst({
            where: {
                ...scopedWhere,
                status
            },
            include: invoiceInclude
        });

        if (!updated) {
            throw new InvoiceError("Hoa don khong ton tai.", 404);
        }

        if (status === InvoiceStatus.PAID) {
            await createInvoiceNotification(
                tx,
                updated,
                "Hoa don da thanh toan",
                `Hoa don ${updated.invoice_code} da duoc ghi nhan thanh toan.`,
                "INVOICE_PAID"
            );
        }

        return updated;
    });

    return normalizeInvoice(invoice);
};

const isFirstDayInVietnam = (date: Date) => {
    const day = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Ho_Chi_Minh",
        day: "2-digit"
    }).format(date);

    return day === "01";
};

export const startMonthlyInvoiceScheduler = () => {
    if ((process.env.INVOICE_AUTO_GENERATE ?? "true").toLowerCase() === "false") {
        console.log("Invoice scheduler is disabled.");
        return;
    }

    const intervalMs = Math.max(60_000, getEnvNumber("INVOICE_SCHEDULER_INTERVAL_MS", 60 * 60 * 1000));
    let lastRunKey = "";
    let running = false;

    const checkAndRun = async () => {
        if (running || !isFirstDayInVietnam(new Date())) {
            return;
        }

        const period = getPreviousBillingPeriod();
        const runKey = `${period.year}-${padMonth(period.month)}`;
        if (lastRunKey === runKey) {
            return;
        }

        running = true;
        try {
            const result = await generateMonthlyInvoicesService(period);
            lastRunKey = runKey;
            console.log(
                `Generated monthly invoices for ${padMonth(period.month)}/${period.year}: ${result.created_count} created, ${result.skipped_count} skipped.`
            );
        } catch (error) {
            console.error("Failed to generate monthly invoices:", error);
        } finally {
            running = false;
        }
    };

    void checkAndRun();
    setInterval(() => void checkAndRun(), intervalMs);
};
