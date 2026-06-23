import { InvoiceStatus, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/database.js";

export type PaymentActor = {
    userId: number;
    role: string;
};

export type PaymentFilters = {
    status?: PaymentStatus;
    payment_method?: string;
    invoice_id?: number;
    tenant_id?: number;
    contract_id?: number;
    building_id?: number;
    search?: string;
    page?: number;
    limit?: number;
};

export type CreatePaymentInput = {
    invoice_id: number;
    payment_method: string;
    transaction_code?: string;
    amount?: number;
    status?: PaymentStatus;
};

export const PAYMENT_METHODS = {
    CASH: "CASH",
    BANK_TRANSFER: "BANK_TRANSFER",
    E_WALLET: "E_WALLET"
} as const;

export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];

export class PaymentError extends Error {
    statusCode: number;

    constructor(message: string, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
    }
}

const invoiceForPaymentInclude = {
    payments: {
        orderBy: { paid_at: "desc" }
    },
    contract: {
        include: {
            tenant: {
                select: {
                    id: true,
                    full_name: true,
                    phone: true,
                    email: true,
                    user_id: true
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
    }
} satisfies Prisma.InvoiceInclude;

const paymentInclude = {
    invoice: {
        include: invoiceForPaymentInclude
    }
} satisfies Prisma.PaymentInclude;

type InvoiceForPayment = Prisma.InvoiceGetPayload<{
    include: typeof invoiceForPaymentInclude;
}>;

type PaymentWithRelations = Prisma.PaymentGetPayload<{
    include: typeof paymentInclude;
}>;

const toNumber = (value: Prisma.Decimal | number) => Number(value);

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

const assertFinitePositive = (value: number, label: string) => {
    if (!Number.isFinite(value) || value <= 0) {
        throw new PaymentError(`${label} phai la so lon hon 0.`);
    }
};

const assertValidPaymentStatus = (status: unknown): status is PaymentStatus => {
    return status === PaymentStatus.SUCCESS || status === PaymentStatus.PENDING || status === PaymentStatus.FAILED;
};

const paymentMethodAliases: Record<string, PaymentMethod> = {
    CASH: PAYMENT_METHODS.CASH,
    TIEN_MAT: PAYMENT_METHODS.CASH,
    BANK_TRANSFER: PAYMENT_METHODS.BANK_TRANSFER,
    CHUYEN_KHOAN: PAYMENT_METHODS.BANK_TRANSFER,
    TRANSFER: PAYMENT_METHODS.BANK_TRANSFER,
    E_WALLET: PAYMENT_METHODS.E_WALLET,
    EWALLET: PAYMENT_METHODS.E_WALLET,
    ELECTRONIC_WALLET: PAYMENT_METHODS.E_WALLET,
    VI_DIEN_TU: PAYMENT_METHODS.E_WALLET,
    MOMO: PAYMENT_METHODS.E_WALLET,
    ZALOPAY: PAYMENT_METHODS.E_WALLET,
    VNPAY: PAYMENT_METHODS.E_WALLET
};

const normalizePaymentMethod = (value: unknown) => {
    if (typeof value !== "string") {
        throw new PaymentError("Vui long nhap phuong thuc thanh toan.");
    }

    const key = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
    const method = paymentMethodAliases[key];

    if (!method) {
        throw new PaymentError("Phuong thuc thanh toan khong hop le. Cac gia tri ho tro: CASH, BANK_TRANSFER, E_WALLET.");
    }

    return method;
};

const normalizeInvoice = (invoice: InvoiceForPayment) => {
    const totalAmount = toNumber(invoice.total_amount);
    const paidAmount = getSuccessfulPaymentTotal(invoice);

    return {
        ...invoice,
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
        payments: invoice.payments.map((payment) => ({
            ...payment,
            amount: toNumber(payment.amount)
        }))
    };
};

const normalizePayment = (payment: PaymentWithRelations) => ({
    ...payment,
    amount: toNumber(payment.amount),
    invoice: normalizeInvoice(payment.invoice)
});

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

const requireManagerBuildingId = async (actor: PaymentActor) => {
    if (actor.role === "ADMIN") {
        return undefined;
    }

    const staff = await getActorStaff(actor.userId);
    if (!staff) {
        throw new PaymentError("Tai khoan chua duoc lien ket voi ho so nhan vien.", 403);
    }

    if (!staff.building_id) {
        throw new PaymentError("Nhan vien chua duoc phan cong toa nha.", 403);
    }

    return staff.building_id;
};

const requireTenantId = async (actor: PaymentActor) => {
    const tenant = await getActorTenant(actor.userId);
    if (!tenant) {
        throw new PaymentError("Tai khoan chua duoc lien ket voi ho so nguoi thue.", 403);
    }

    return tenant.id;
};

const assertCanManagePayments = (actor: PaymentActor) => {
    if (!["ADMIN", "MANAGER"].includes(actor.role)) {
        throw new PaymentError("Ban khong co quyen quan ly thanh toan.", 403);
    }
};

const getPaymentScopeWhere = async (actor: PaymentActor): Promise<Prisma.PaymentWhereInput> => {
    if (actor.role === "ADMIN") {
        return {};
    }

    if (actor.role === "MANAGER") {
        const buildingId = await requireManagerBuildingId(actor);
        return {
            invoice: {
                contract: {
                    apartment: {
                        building_id: buildingId
                    }
                }
            }
        };
    }

    if (actor.role === "TENANT") {
        return {
            invoice: {
                tenant_id: await requireTenantId(actor)
            }
        };
    }

    throw new PaymentError("Ban khong co quyen truy cap thanh toan.", 403);
};

const getInvoiceByIdOrThrow = async (id: number) => {
    const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: invoiceForPaymentInclude
    });

    if (!invoice) {
        throw new PaymentError("Hoa don khong ton tai.", 404);
    }

    return invoice;
};

const getPaymentByIdOrThrow = async (id: number) => {
    const payment = await prisma.payment.findUnique({
        where: { id },
        include: paymentInclude
    });

    if (!payment) {
        throw new PaymentError("Giao dich thanh toan khong ton tai.", 404);
    }

    return payment;
};

const assertInvoiceAccessible = async (invoice: InvoiceForPayment, actor: PaymentActor) => {
    if (actor.role === "ADMIN") {
        return;
    }

    if (actor.role === "MANAGER") {
        const buildingId = await requireManagerBuildingId(actor);
        if (invoice.contract.apartment.building_id !== buildingId) {
            throw new PaymentError("Ban khong co quyen thao tac voi thanh toan cua toa nha nay.", 403);
        }
        return;
    }

    if (actor.role === "TENANT") {
        const tenantId = await requireTenantId(actor);
        if (invoice.tenant_id !== tenantId) {
            throw new PaymentError("Ban khong co quyen thao tac voi hoa don nay.", 403);
        }
        return;
    }

    throw new PaymentError("Ban khong co quyen truy cap thanh toan.", 403);
};

const getSuccessfulPaymentTotal = (invoice: Pick<InvoiceForPayment, "payments">, excludePaymentId?: number) => {
    return invoice.payments
        .filter((payment) => payment.status === PaymentStatus.SUCCESS && payment.id !== excludePaymentId)
        .reduce((sum, payment) => sum + toNumber(payment.amount), 0);
};

const createPaymentNotification = async (
    tx: Prisma.TransactionClient,
    invoice: InvoiceForPayment,
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

const syncInvoicePaymentStatus = async (tx: Prisma.TransactionClient, invoiceId: number) => {
    const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: invoiceForPaymentInclude
    });

    if (!invoice) {
        throw new PaymentError("Hoa don khong ton tai.", 404);
    }

    const totalAmount = toNumber(invoice.total_amount);
    const paidAmount = getSuccessfulPaymentTotal(invoice);
    const isPaid = totalAmount > 0 && paidAmount >= totalAmount;

    return tx.invoice.update({
        where: { id: invoiceId },
        data: {
            status: isPaid ? InvoiceStatus.PAID : InvoiceStatus.UNPAID,
            paid_at: isPaid ? new Date() : null
        },
        include: invoiceForPaymentInclude
    });
};

const assertSuccessAmountWithinInvoice = (
    invoice: InvoiceForPayment,
    paymentAmount: number,
    excludePaymentId?: number
) => {
    const totalAmount = toNumber(invoice.total_amount);
    const paidAmount = getSuccessfulPaymentTotal(invoice, excludePaymentId);

    if (roundMoney(paidAmount + paymentAmount) > totalAmount) {
        throw new PaymentError("Tong so tien thanh toan thanh cong vuot qua tong tien hoa don.");
    }
};

export const getPaymentsService = async (filters: PaymentFilters, actor: PaymentActor) => {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 10));
    const skip = (page - 1) * limit;

    const andFilters: Prisma.PaymentWhereInput[] = [await getPaymentScopeWhere(actor)];

    if (filters.status) {
        andFilters.push({ status: filters.status });
    }

    if (filters.payment_method) {
        andFilters.push({
            payment_method: normalizePaymentMethod(filters.payment_method)
        });
    }

    if (filters.invoice_id) {
        andFilters.push({ invoice_id: filters.invoice_id });
    }

    if (filters.tenant_id) {
        andFilters.push({
            invoice: {
                tenant_id: filters.tenant_id
            }
        });
    }

    if (filters.contract_id) {
        andFilters.push({
            invoice: {
                contract_id: filters.contract_id
            }
        });
    }

    if (filters.building_id) {
        if (actor.role === "MANAGER") {
            const managerBuildingId = await requireManagerBuildingId(actor);
            if (managerBuildingId !== filters.building_id) {
                throw new PaymentError("Ban khong co quyen xem thanh toan cua toa nha nay.", 403);
            }
        }

        andFilters.push({
            invoice: {
                contract: {
                    apartment: {
                        building_id: filters.building_id
                    }
                }
            }
        });
    }

    if (filters.search) {
        andFilters.push({
            OR: [
                { payment_method: { contains: filters.search, mode: "insensitive" } },
                { transaction_code: { contains: filters.search, mode: "insensitive" } },
                { invoice: { invoice_code: { contains: filters.search, mode: "insensitive" } } },
                { invoice: { contract: { tenant: { full_name: { contains: filters.search, mode: "insensitive" } } } } }
            ]
        });
    }

    const whereClause: Prisma.PaymentWhereInput = { AND: andFilters };

    const [payments, total] = await prisma.$transaction([
        prisma.payment.findMany({
            where: whereClause,
            skip,
            take: limit,
            orderBy: { paid_at: "desc" },
            include: paymentInclude
        }),
        prisma.payment.count({ where: whereClause })
    ]);

    return {
        data: payments.map(normalizePayment),
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
};

export const getPaymentByIdService = async (id: number, actor: PaymentActor) => {
    const payment = await getPaymentByIdOrThrow(id);
    await assertInvoiceAccessible(payment.invoice, actor);
    return normalizePayment(payment);
};

export const createPaymentService = async (input: CreatePaymentInput, actor: PaymentActor) => {
    const invoice = await getInvoiceByIdOrThrow(input.invoice_id);
    await assertInvoiceAccessible(invoice, actor);

    if (invoice.status === InvoiceStatus.PAID) {
        throw new PaymentError("Hoa don da duoc thanh toan.");
    }

    const paymentMethod = normalizePaymentMethod(input.payment_method);

    const status = input.status ?? (actor.role === "TENANT" ? PaymentStatus.PENDING : PaymentStatus.SUCCESS);
    if (!assertValidPaymentStatus(status)) {
        throw new PaymentError("Trang thai thanh toan khong hop le.");
    }

    if (actor.role === "TENANT" && status !== PaymentStatus.PENDING) {
        throw new PaymentError("Nguoi thue khong the tu xac nhan thanh toan thanh cong.", 403);
    }

    const totalAmount = toNumber(invoice.total_amount);
    const paidAmount = getSuccessfulPaymentTotal(invoice);
    const remainingAmount = roundMoney(Math.max(totalAmount - paidAmount, 0));
    const amount = input.amount ?? remainingAmount;

    assertFinitePositive(amount, "So tien thanh toan");
    if (amount > remainingAmount) {
        throw new PaymentError("So tien thanh toan vuot qua so tien con lai.");
    }

    if (status === PaymentStatus.SUCCESS) {
        assertSuccessAmountWithinInvoice(invoice, amount);
    }

    try {
        const payment = await prisma.$transaction(async (tx) => {
            const created = await tx.payment.create({
                data: {
                    invoice_id: input.invoice_id,
                    payment_method: paymentMethod,
                    transaction_code: input.transaction_code?.trim() || undefined,
                    amount,
                    status
                }
            });

            const updatedInvoice = await syncInvoicePaymentStatus(tx, input.invoice_id);
            if (updatedInvoice.status === InvoiceStatus.PAID && invoice.status !== InvoiceStatus.PAID) {
                await createPaymentNotification(
                    tx,
                    updatedInvoice,
                    "Hoa don da thanh toan",
                    `Hoa don ${updatedInvoice.invoice_code} da duoc ghi nhan thanh toan.`,
                    "INVOICE_PAID"
                );
            }

            return tx.payment.findUniqueOrThrow({
                where: { id: created.id },
                include: paymentInclude
            });
        });

        return normalizePayment(payment);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            throw new PaymentError("Ma giao dich da ton tai.");
        }

        throw error;
    }
};

export const updatePaymentStatusService = async (
    id: number,
    status: PaymentStatus,
    actor: PaymentActor
) => {
    assertCanManagePayments(actor);
    if (!assertValidPaymentStatus(status)) {
        throw new PaymentError("Trang thai thanh toan khong hop le.");
    }

    const current = await getPaymentByIdOrThrow(id);
    await assertInvoiceAccessible(current.invoice, actor);

    if (status === PaymentStatus.SUCCESS) {
        assertSuccessAmountWithinInvoice(current.invoice, toNumber(current.amount), current.id);
    }

    const payment = await prisma.$transaction(async (tx) => {
        const updatedPayment = await tx.payment.update({
            where: { id },
            data: {
                status,
                paid_at: status === PaymentStatus.SUCCESS ? new Date() : current.paid_at
            }
        });

        const updatedInvoice = await syncInvoicePaymentStatus(tx, current.invoice_id);
        if (updatedInvoice.status === InvoiceStatus.PAID && current.invoice.status !== InvoiceStatus.PAID) {
            await createPaymentNotification(
                tx,
                updatedInvoice,
                "Hoa don da thanh toan",
                `Hoa don ${updatedInvoice.invoice_code} da duoc ghi nhan thanh toan.`,
                "INVOICE_PAID"
            );
        }

        return tx.payment.findUniqueOrThrow({
            where: { id: updatedPayment.id },
            include: paymentInclude
        });
    });

    return normalizePayment(payment);
};
