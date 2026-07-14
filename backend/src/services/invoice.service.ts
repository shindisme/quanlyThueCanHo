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
import { getCurrentManagerAssignment } from "../utils/manager-scope.js";
import {
    buildFirstRentalInvoiceItems,
    buildRecurringMonthlyInvoiceItems,
    calculateElectricTierDetails,
    type BillingInvoiceItem
} from "../utils/invoice-billing.js";

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

type PlannedMonthlyInvoice = {
    contract: ContractForBilling;
    invoiceCode: string;
    items: BillingInvoiceItem[];
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
            `${label} phải là số không âm, nằm trong Decimal(12,2) và có tối đa hai chữ số thập phân.`
        );
    }
};

const assertValidMonthYear = (month: number, year: number) => {
    if (!Number.isInteger(month) || month < 1 || month > 12) {
        throw new InvoiceError("Tháng hóa đơn không hợp lệ.");
    }

    if (!Number.isInteger(year) || year < 2000 || year > 3000) {
        throw new InvoiceError("Năm hóa đơn không hợp lệ.");
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
            `Cấu hình ${key} không hợp lệ.`,
            invalidStatusCode
        );
    }

    return parsed;
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
        throw new InvoiceError("Phải nhập đầy đủ tháng và năm.");
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

const isFirstRentalMonth = (
    startDate: Date,
    month: number,
    year: number
) => startDate.getUTCFullYear() === year
    && startDate.getUTCMonth() + 1 === month;

const isElectricInvoiceItem = (itemName: string) => {
    const normalized = itemName.normalize("NFC").toLocaleLowerCase("vi-VN");

    return normalized.includes("tiền điện") || normalized.includes("tien dien");
};
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
        items: invoice.items.map((item) => {
            const quantity = toNumber(item.quantity);
            const electricTierDetails = isElectricInvoiceItem(item.item_name)
                ? calculateElectricTierDetails(quantity)
                : [];

            return {
                ...item,
                quantity,
                unit_price: toNumber(item.unit_price),
                amount: toNumber(item.amount),
                ...(electricTierDetails.length > 0
                    ? { electric_tier_details: electricTierDetails }
                    : {})
            };
        })
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
            "Tài khoản chưa được liên kết với hồ sơ người thuê.",
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

    throw new InvoiceError("Bạn không có quyền truy cập hóa đơn.", 403);
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
        throw new InvoiceError("Hóa đơn không tồn tại.", 404);
    }

    return invoice;
};

const assertCanManageInvoices = (actor: InvoiceActor) => {
    if (
        actor.role !== Role.ADMIN
        && actor.role !== Role.MANAGER
    ) {
        throw new InvoiceError("Bạn không có quyền quản lý hóa đơn.", 403);
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
        const firstRentalMonth = isFirstRentalMonth(
            contract.start_date,
            month,
            year
        );
        const existing = await prisma.invoice.findUnique({
            where: { invoice_code: invoiceCode }
        });

        if (existing) {
            skipped.push({
                contract_id: contract.id,
                invoice_code: invoiceCode,
                reason: "Hóa đơn tháng này đã tồn tại."
            });
            continue;
        }

        const items = firstRentalMonth
            ? buildFirstRentalInvoiceItems({
                depositAmount: contract.deposit_amount,
                monthlyRent: contract.monthly_rent,
                area: contract.apartment.area
            })
            : await buildRecurringItemsForContract(
                contract,
                month,
                year,
                missingUtilityReadings
            );
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
            "Tổng tiền hóa đơn"
        );

        const totalAmount = totalAmountDecimal.toNumber();
        assertNonNegativeMoney(
            totalAmount,
            "Tổng tiền hóa đơn"
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
                        "Hóa đơn mới",
                        `Hóa đơn ${invoiceCode} đã được tạo với tổng tiền ${totalAmount}.`,
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
                    reason: "Hóa đơn tháng này đã tồn tại."
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

const buildRecurringItemsForContract = async (
    contract: ContractForBilling,
    month: number,
    year: number,
    missingUtilityReadings: Array<{
        apartment_id: number;
        room_number: string;
        contract_id: number;
    }>
): Promise<BillingInvoiceItem[]> => {
    const reading = await prisma.utilityReading.findFirst({
        where: {
            apartment_id: contract.apartment_id,
            month,
            year
        }
    });

    if (!reading) {
        missingUtilityReadings.push({
            apartment_id: contract.apartment_id,
            room_number: contract.apartment.room_number,
            contract_id: contract.id
        });
    }

    return buildRecurringMonthlyInvoiceItems({
        monthlyRent: contract.monthly_rent,
        area: contract.apartment.area,
        electricConsumption: reading
            ? nonNegativeDecimalDifference(reading.electric_new, reading.electric_old)
            : new Prisma.Decimal(0),
        waterConsumption: reading
            ? nonNegativeDecimalDifference(reading.water_new, reading.water_old)
            : new Prisma.Decimal(0),
        periodLabel: padMonth(month) + "/" + year
    });
};
export const updateInvoiceStatusService = async (
    id: number,
    status: InvoiceStatus,
    actor: InvoiceActor
) => {
    assertCanManageInvoices(actor);
    if (!assertValidInvoiceStatus(status)) {
        throw new InvoiceError("Trạng thái hóa đơn không hợp lệ.");
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
            throw new InvoiceError("Hóa đơn không tồn tại.", 404);
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
                    "Hóa đơn không tồn tại.",
                    404
                );
            }

            if (observed.status === status) {
                return observed;
            }

            throw new AppError(
                409,
                "CONCURRENT_MODIFICATION",
                "Trạng thái hóa đơn đã thay đổi trong quá trình thực hiện"
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
            throw new InvoiceError("Hóa đơn không tồn tại.", 404);
        }

        if (status === InvoiceStatus.PAID) {
            await createInvoiceNotification(
                tx,
                updated,
                "Hóa đơn đã thanh toán",
                `Hóa đơn ${updated.invoice_code} đã được ghi nhận thanh toán.`,
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
