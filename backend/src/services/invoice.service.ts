import { InvoiceStatus, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/database.js";

export type InvoiceActor = {
    userId: number;
    role: string;
};

export type InvoiceFilters = {
    status?: InvoiceStatus;
    tenant_id?: number;
    contract_id?: number;
    apartment_id?: number;
    building_id?: number;
    month?: number;
    year?: number;
    search?: string;
    page?: number;
    limit?: number;
};

export type MonthlyInvoiceInput = {
    month?: number;
    year?: number;
    building_id?: number;
    due_date?: string;
    management_fee?: number;
    management_fee_per_m2?: number;
    electric_unit_price?: number;
    water_unit_price?: number;
    internet_fee?: number;
    notify?: boolean;
};

export class InvoiceError extends Error {
    statusCode: number;

    constructor(message: string, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
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

const padMonth = (month: number) => month.toString().padStart(2, "0");

const toNumber = (value: Prisma.Decimal | number) => Number(value);

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

const assertFiniteNonNegative = (value: number, label: string) => {
    if (!Number.isFinite(value) || value < 0) {
        throw new InvoiceError(`${label} phai la so khong am.`);
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

const getEnvNumber = (key: string, fallback: number) => {
    const value = process.env[key];
    if (value === undefined || value === "") {
        return fallback;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        throw new InvoiceError(`Cau hinh ${key} khong hop le.`, 500);
    }

    return parsed;
};

const getFeeConfig = (input: MonthlyInvoiceInput) => {
    const config = {
        managementFee: input.management_fee ?? getEnvNumber("INVOICE_MANAGEMENT_FEE", 0),
        managementFeePerM2: input.management_fee_per_m2 ?? getEnvNumber("INVOICE_MANAGEMENT_FEE_PER_M2", 0),
        electricUnitPrice: input.electric_unit_price ?? getEnvNumber("INVOICE_ELECTRIC_UNIT_PRICE", 0),
        waterUnitPrice: input.water_unit_price ?? getEnvNumber("INVOICE_WATER_UNIT_PRICE", 0),
        internetFee: input.internet_fee ?? getEnvNumber("INVOICE_INTERNET_FEE", 0)
    };

    assertFiniteNonNegative(config.managementFee, "Phi quan ly");
    assertFiniteNonNegative(config.managementFeePerM2, "Phi quan ly theo m2");
    assertFiniteNonNegative(config.electricUnitPrice, "Don gia dien");
    assertFiniteNonNegative(config.waterUnitPrice, "Don gia nuoc");
    assertFiniteNonNegative(config.internetFee, "Phi internet");

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

    const dueDate = new Date(input.due_date);
    if (Number.isNaN(dueDate.getTime())) {
        throw new InvoiceError("Ngay den han khong hop le.");
    }

    return dueDate;
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

const getActorStaff = async (userId: number) => {
    return prisma.staff.findUnique({
        where: { user_id: userId },
        select: {
            id: true,
            building_id: true
        }
    });
};

const getActorTenant = async (userId: number) => {
    return prisma.tenant.findUnique({
        where: { user_id: userId },
        select: {
            id: true,
            user_id: true
        }
    });
};

const requireManagerBuildingId = async (actor: InvoiceActor) => {
    if (actor.role === "ADMIN") {
        return undefined;
    }

    const staff = await getActorStaff(actor.userId);
    if (!staff) {
        throw new InvoiceError("Tai khoan chua duoc lien ket voi ho so nhan vien.", 403);
    }

    if (!staff.building_id) {
        throw new InvoiceError("Nhan vien chua duoc phan cong toa nha.", 403);
    }

    return staff.building_id;
};

const requireTenantId = async (actor: InvoiceActor) => {
    const tenant = await getActorTenant(actor.userId);
    if (!tenant) {
        throw new InvoiceError("Tai khoan chua duoc lien ket voi ho so nguoi thue.", 403);
    }

    return tenant.id;
};

const getInvoiceScopeWhere = async (actor: InvoiceActor): Promise<Prisma.InvoiceWhereInput> => {
    if (actor.role === "ADMIN") {
        return {};
    }

    if (actor.role === "MANAGER") {
        const buildingId = await requireManagerBuildingId(actor);
        return {
            contract: {
                apartment: {
                    building_id: buildingId
                }
            }
        };
    }

    if (actor.role === "TENANT") {
        return {
            tenant_id: await requireTenantId(actor)
        };
    }

    throw new InvoiceError("Ban khong co quyen truy cap hoa don.", 403);
};

const getInvoiceByIdOrThrow = async (id: number) => {
    const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: invoiceInclude
    });

    if (!invoice) {
        throw new InvoiceError("Hoa don khong ton tai.", 404);
    }

    return invoice;
};

const assertInvoiceAccessible = async (invoice: InvoiceWithRelations, actor: InvoiceActor) => {
    if (actor.role === "ADMIN") {
        return;
    }

    if (actor.role === "MANAGER") {
        const buildingId = await requireManagerBuildingId(actor);
        if (invoice.contract.apartment.building_id !== buildingId) {
            throw new InvoiceError("Ban khong co quyen thao tac voi hoa don cua toa nha nay.", 403);
        }
        return;
    }

    if (actor.role === "TENANT") {
        const tenantId = await requireTenantId(actor);
        if (invoice.tenant_id !== tenantId) {
            throw new InvoiceError("Ban khong co quyen thao tac voi hoa don nay.", 403);
        }
        return;
    }

    throw new InvoiceError("Ban khong co quyen truy cap hoa don.", 403);
};

const assertCanManageInvoices = (actor: InvoiceActor) => {
    if (!["ADMIN", "MANAGER"].includes(actor.role)) {
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
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 10));
    const skip = (page - 1) * limit;

    const andFilters: Prisma.InvoiceWhereInput[] = [await getInvoiceScopeWhere(actor)];

    if (filters.status) {
        andFilters.push({ status: filters.status });
    }

    if (filters.tenant_id) {
        andFilters.push({ tenant_id: filters.tenant_id });
    }

    if (filters.contract_id) {
        andFilters.push({ contract_id: filters.contract_id });
    }

    if (filters.apartment_id) {
        andFilters.push({
            contract: {
                apartment_id: filters.apartment_id
            }
        });
    }

    if (filters.building_id) {
        if (actor.role === "MANAGER") {
            const managerBuildingId = await requireManagerBuildingId(actor);
            if (managerBuildingId !== filters.building_id) {
                throw new InvoiceError("Ban khong co quyen xem hoa don cua toa nha nay.", 403);
            }
        }

        andFilters.push({
            contract: {
                apartment: {
                    building_id: filters.building_id
                }
            }
        });
    }

    if (filters.month !== undefined || filters.year !== undefined) {
        if (filters.month === undefined || filters.year === undefined) {
            throw new InvoiceError("Can nhap day du month va year de loc hoa don.");
        }

        assertValidMonthYear(filters.month, filters.year);
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

    const whereClause: Prisma.InvoiceWhereInput = { AND: andFilters };

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
    const invoice = await getInvoiceByIdOrThrow(id);
    await assertInvoiceAccessible(invoice, actor);
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

    let buildingId = input.building_id;
    if (actor?.role === "MANAGER") {
        const managerBuildingId = await requireManagerBuildingId(actor);
        if (buildingId && buildingId !== managerBuildingId) {
            throw new InvoiceError("Ban khong co quyen tao hoa don cho toa nha nay.", 403);
        }
        buildingId = managerBuildingId;
    }

    const periodStart = new Date(Date.UTC(year, month - 1, 1));
    const periodEnd = new Date(Date.UTC(year, month, 1));

    const contracts = await prisma.rentalContract.findMany({
        where: {
            status: "ACTIVE",
            start_date: { lt: periodEnd },
            end_date: { gte: periodStart },
            ...(buildingId
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

        try {
            const invoice = await prisma.$transaction(async (tx) => {
                const reading = await tx.utilityReading.findFirst({
                    where: {
                        apartment_id: contract.apartment_id,
                        month,
                        year
                    }
                });

                const electricConsumption = reading
                    ? Math.max(0, toNumber(reading.electric_new) - toNumber(reading.electric_old))
                    : 0;
                const waterConsumption = reading
                    ? Math.max(0, toNumber(reading.water_new) - toNumber(reading.water_old))
                    : 0;

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
                const totalAmount = roundMoney(items.reduce((sum, item) => sum + item.amount, 0));

                const newInvoice = await tx.invoice.create({
                    data: {
                        contract_id: contract.id,
                        tenant_id: contract.tenant_id,
                        invoice_code: invoiceCode,
                        due_date: dueDate,
                        total_amount: totalAmount,
                        status: InvoiceStatus.UNPAID,
                        items: {
                            create: items
                        }
                    },
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

const buildMonthlyItems = (
    contract: ContractForBilling,
    options: {
        month: number;
        year: number;
        electricConsumption: number;
        waterConsumption: number;
        feeConfig: ReturnType<typeof getFeeConfig>;
    }
) => {
    const periodLabel = `${padMonth(options.month)}/${options.year}`;
    const rentAmount = roundMoney(toNumber(contract.monthly_rent));
    const apartmentArea = toNumber(contract.apartment.area);
    const managementAmount = roundMoney(
        options.feeConfig.managementFee + apartmentArea * options.feeConfig.managementFeePerM2
    );
    const electricAmount = roundMoney(options.electricConsumption * options.feeConfig.electricUnitPrice);
    const waterAmount = roundMoney(options.waterConsumption * options.feeConfig.waterUnitPrice);
    const internetAmount = roundMoney(options.feeConfig.internetFee);

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

    const current = await getInvoiceByIdOrThrow(id);
    await assertInvoiceAccessible(current, actor);

    const invoice = await prisma.$transaction(async (tx) => {
        const updated = await tx.invoice.update({
            where: { id },
            data: {
                status,
                paid_at: status === InvoiceStatus.PAID ? new Date() : null
            },
            include: invoiceInclude
        });

        if (status === InvoiceStatus.PAID && current.status !== InvoiceStatus.PAID) {
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
