import jwt from "jsonwebtoken";
import {
    ApartmentStatus,
    InvoiceStatus,
    InvoiceType,
    PaymentStatus,
    ReservationStatus,
    Prisma,
    Role,
    UserStatus
} from "@prisma/client";
import { prisma } from "../config/database.js";
import { AppError } from "../errors/app-error.js";
import type {
    CreatePaymentRequest,
    CreateVnpayPaymentRequest,
    ListPaymentsRequest
} from "../schemas/payment.schema.js";
import type { Actor } from "../types/auth.js";
import {
    isDecimal12_2Amount,
    toMoneyCents
} from "../utils/money.js";
import { getManagerApartmentScope } from "../utils/manager-scope.js";
import {
    buildVnpayPaymentUrl,
    formatVnpayDate,
    getVnpayConfig,
    normalizeVnpayCallbackParams,
    verifyVnpaySecureHash
} from "../utils/vnpay.js";
import { sendReservationDepositPaidEmail } from "./mail.service.js";
import {
    generateQrCodeDataUrl,
    generateQrCodeSvg
} from "../utils/qrcode.js";
export type PaymentActor = Actor;
export type PaymentFilters = ListPaymentsRequest["query"];
export type CreatePaymentInput = CreatePaymentRequest["body"];
export type CreateVnpayPaymentInput = CreateVnpayPaymentRequest["body"];

export const PAYMENT_METHODS = {
    E_WALLET: "E_WALLET",
    CASH: "CASH"
} as const;

type PaymentMethod =
    typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];

const invoiceForPaymentInclude = {
    payments: {
        orderBy: { paid_at: "desc" }
    },
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
                    status: true
                }
            }
        }
    },
    reservation: {
        include: {
            apartment: {
                select: {
                    id: true,
                    status: true,
                    floor: true,
                    room_number: true,
                    building: {
                        select: {
                            id: true,
                            branch_name: true,
                            address: true
                        }
                    }
                }
            }
        }
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
                            address: true
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

type PaymentSideEffect = {
    kind: "SEND_DEPOSIT_PAID_EMAIL";
    invoice: InvoiceForPayment;
};

type InvoicePaymentSyncResult = {
    invoice: InvoiceForPayment;
    sideEffects: PaymentSideEffect[];
};

const notFound = (resource: "invoice" | "payment") =>
    new AppError(
        404,
        "NOT_FOUND",
        resource === "invoice"
            ? "Hóa đơn không tồn tại"
            : "Khoản thanh toán không tồn tại"
    );

const validationError = (message: string) =>
    new AppError(400, "VALIDATION_ERROR", message);

const concurrentModification = () =>
    new AppError(
        409,
        "CONCURRENT_MODIFICATION",
        "Khoản thanh toán đã bị thay đổi trong quá trình thực hiện"
    );

const SERIALIZABLE_RETRY_LIMIT = 3;
const TRANSACTION_MAX_WAIT_MS = 10_000;
const TRANSACTION_TIMEOUT_MS = 20_000;

const runSerializableTransaction = async <T>(
    operation: (
        transaction: Prisma.TransactionClient
    ) => Promise<T>
) => {
    for (
        let attempt = 1;
        attempt <= SERIALIZABLE_RETRY_LIMIT;
        attempt++
    ) {
        try {
            return await prisma.$transaction(operation, {
                isolationLevel:
                    Prisma.TransactionIsolationLevel.Serializable,
                maxWait: TRANSACTION_MAX_WAIT_MS,
                timeout: TRANSACTION_TIMEOUT_MS
            });
        } catch (error) {
            const isRetryablePrismaError =
                error instanceof
                    Prisma.PrismaClientKnownRequestError
                && (
                    error.code === "P2034"
                    || error.code === "P2028"
                );

            if (!isRetryablePrismaError) {
                throw error;
            }

            if (attempt === SERIALIZABLE_RETRY_LIMIT) {
                if (
                    error instanceof
                        Prisma.PrismaClientKnownRequestError
                    && error.code === "P2028"
                ) {
                    throw new AppError(
                        503,
                        "TRANSACTION_TIMEOUT",
                        "Giao dịch cơ sở dữ liệu đã hết thời gian chờ. Vui lòng thử lại."
                    );
                }

                throw concurrentModification();
            }
        }
    }

    throw concurrentModification();
};

const toNumber = (value: Prisma.Decimal | number) => Number(value);

const getSuccessfulPaymentTotalCents = (
    invoice: Pick<InvoiceForPayment, "payments">,
    excludePaymentId?: number
) => invoice.payments
    .filter((payment) => (
        payment.status === PaymentStatus.SUCCESS
        && payment.id !== excludePaymentId
    ))
    .reduce(
        (sum, payment) =>
            sum + toMoneyCents(toNumber(payment.amount)),
        0
    );

const normalizeInvoice = (invoice: InvoiceForPayment) => {
    const totalAmount = toNumber(invoice.total_amount);
    const totalAmountCents = toMoneyCents(totalAmount);
    const paidAmountCents =
        getSuccessfulPaymentTotalCents(invoice);
    const contract = invoice.contract === null
        ? null
        : {
            ...invoice.contract,
            deposit_amount:
                toNumber(invoice.contract.deposit_amount),
            monthly_rent:
                toNumber(invoice.contract.monthly_rent),
            apartment: {
                ...invoice.contract.apartment,
                area: toNumber(invoice.contract.apartment.area),
                rental_price: toNumber(
                    invoice.contract.apartment.rental_price
                )
            }
        };

    return {
        ...invoice,
        total_amount: totalAmount,
        paid_amount: paidAmountCents / 100,
        remaining_amount:
            Math.max(totalAmountCents - paidAmountCents, 0)
            / 100,
        contract,
        reservation: invoice.reservation === null
            ? null
            : {
                ...invoice.reservation,
                deposit_amount: toNumber(invoice.reservation.deposit_amount)
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

const paymentMethodAliases: Record<string, PaymentMethod> = {
    E_WALLET: PAYMENT_METHODS.E_WALLET,
    EWALLET: PAYMENT_METHODS.E_WALLET,
    ELECTRONIC_WALLET: PAYMENT_METHODS.E_WALLET,
    VI_DIEN_TU: PAYMENT_METHODS.E_WALLET,
    VNPAY: PAYMENT_METHODS.E_WALLET,
    CASH: PAYMENT_METHODS.CASH,
    TIEN_MAT: PAYMENT_METHODS.CASH
};

export const normalizePaymentMethod = (value: string) => {
    const key = value
        .trim()
        .toUpperCase()
        .replace(/[\s-]+/g, "_");
    const method = paymentMethodAliases[key];

    if (!method) {
        throw validationError("Payment method is not supported");
    }

    return method;
};

export const generateCashTransactionCode = (
    invoiceId: number,
    timestamp = new Date()
) => `CASH-${invoiceId}-${timestamp.getTime()}`;

export const canCreateVnpayPaymentUrlForRole = (role: Role) => (
    role === Role.ADMIN
    || role === Role.MANAGER
    || role === Role.TENANT
);

const requireTenantId = (actor: Actor) => {
    if (actor.tenantId === undefined) {
        throw new AppError(
            403,
            "TENANT_PROFILE_REQUIRED",
            "Yêu cầu phải có hồ sơ khách thuê liên kết"
        );
    }

    return actor.tenantId;
};



const DEPOSIT_PAYMENT_PURPOSE = "reservation_deposit_payment";

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new AppError(
            500,
            "JWT_NOT_CONFIGURED",
            "Cấu hình xác thực JWT chưa được thiết lập"
        );
    }

    return secret;
};

const getDepositPaymentJwtSecret = () => (
    process.env.DEPOSIT_PAYMENT_JWT_SECRET
    ?? `${getJwtSecret()}:reservation-deposit-payment`
);

const getBackendBaseUrl = () => (
    process.env.BACKEND_URL
    ?? `http://localhost:${process.env.PORT ?? 3000}`
).replace(/\/$/, "");

const invalidDepositPaymentToken = () => new AppError(
    400,
    "INVALID_DEPOSIT_PAYMENT_TOKEN",
    "Link thanh toán tiền cọc không hợp lệ hoặc đã hết hạn"
);

export const buildDepositPaymentUrl = (invoiceId: number) => {
    const token = jwt.sign(
        { purpose: DEPOSIT_PAYMENT_PURPOSE },
        getDepositPaymentJwtSecret(),
        {
            algorithm: "HS256",
            expiresIn: "15d",
            subject: String(invoiceId)
        }
    );

    return `${getBackendBaseUrl()}/payments/deposit/${encodeURIComponent(token)}`;
};

const verifyDepositPaymentToken = (token: string) => {
    let payload: { sub?: unknown; purpose?: unknown };

    try {
        const verified = jwt.verify(
            token,
            getDepositPaymentJwtSecret(),
            { algorithms: ["HS256"] }
        );

        if (typeof verified === "string") {
            throw invalidDepositPaymentToken();
        }

        payload = verified;
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }

        throw invalidDepositPaymentToken();
    }

    if (payload.purpose !== DEPOSIT_PAYMENT_PURPOSE) {
        throw invalidDepositPaymentToken();
    }

    const invoiceId = Number(payload.sub);
    if (!Number.isInteger(invoiceId) || invoiceId <= 0) {
        throw invalidDepositPaymentToken();
    }

    return invoiceId;
};
const getInvoiceScopeWhere = (
    actor: Actor
): Prisma.InvoiceWhereInput => {
    if (actor.role === Role.ADMIN) {
        return {};
    }

    if (actor.role === Role.MANAGER) {
        return getManagerInvoiceScope(actor);
    }

    if (actor.role === Role.TENANT) {
        return {
            tenant_id: requireTenantId(actor)
        };
    }

    throw new AppError(
        403,
        "FORBIDDEN",
        "Truy cập thanh toán bị cấm"
    );
};

const getManagerInvoiceScope = (
    actor: Actor
): Prisma.InvoiceWhereInput => {
    const apartmentScope = getManagerApartmentScope(actor);

    return {
        OR: [
            {
                contract: {
                    apartment: apartmentScope
                }
            },
            {
                reservation: {
                    apartment: apartmentScope
                }
            }
        ]
    };
};

const getPaymentScopeWhere = (
    actor: Actor
): Prisma.PaymentWhereInput => {
    if (actor.role === Role.ADMIN) {
        return {};
    }

    return {
        invoice: getInvoiceScopeWhere(actor)
    };
};

const getScopedInvoiceWhere = (
    id: number,
    actor: Actor
) => {
    if (actor.role === Role.ADMIN) {
        return {
            id
        } satisfies Prisma.InvoiceWhereUniqueInput;
    }

    if (actor.role === Role.MANAGER) {
        return {
            id,
            ...getManagerInvoiceScope(actor)
        } satisfies Prisma.InvoiceWhereInput;
    }

    return {
        id,
        tenant_id: requireTenantId(actor)
    } satisfies Prisma.InvoiceWhereUniqueInput;
};

const getScopedPaymentWhere = (
    id: number,
    actor: Actor
) => {
    if (actor.role === Role.ADMIN) {
        return {
            id
        } satisfies Prisma.PaymentWhereUniqueInput;
    }

    if (actor.role === Role.MANAGER) {
        return {
            id,
            invoice: getManagerInvoiceScope(actor)
        } satisfies Prisma.PaymentWhereUniqueInput;
    }

    return {
        id,
        invoice: {
            tenant_id: requireTenantId(actor)
        }
    } satisfies Prisma.PaymentWhereUniqueInput;
};

const findPaymentInScope = async (
    database: Pick<
        Prisma.TransactionClient,
        "payment"
    >,
    id: number,
    actor: Actor
) => {
    const payment = await database.payment.findFirst({
        where: getScopedPaymentWhere(id, actor),
        include: paymentInclude
    });

    if (!payment) {
        throw notFound("payment");
    }

    return payment;
};

const assertCanManagePayments = (actor: Actor) => {
    if (
        actor.role !== Role.ADMIN
        && actor.role !== Role.MANAGER
    ) {
        throw new AppError(
            403,
            "FORBIDDEN",
            "Quyền quản lý thanh toán bị cấm"
        );
    }
};

const assertSuccessAmountWithinInvoice = (
    invoice: InvoiceForPayment,
    amount: number,
    excludePaymentId?: number
) => {
    const successfulTotalCents =
        getSuccessfulPaymentTotalCents(
            invoice,
            excludePaymentId
        );

    if (
        successfulTotalCents + toMoneyCents(amount)
        > toMoneyCents(toNumber(invoice.total_amount))
    ) {
        throw validationError(
            "Tổng số tiền thanh toán thành công vượt quá tổng tiền hóa đơn"
        );
    }
};

const createPaidNotification = async (
    transaction: Prisma.TransactionClient,
    invoice: InvoiceForPayment
) => {
    const userId = invoice.tenant.user_id;

    if (userId === null) {
        return;
    }

    await transaction.notification.create({
        data: {
            user_id: userId,
            title: "Hóa đơn đã thanh toán",
            content:
                `Hóa đơn ${invoice.invoice_code} `
                + "đã được ghi nhận thanh toán thành công.",
            type: "INVOICE_PAID"
        }
    });
};

const formatReservedApartmentLabel = (
    apartment: {
        room_number: string;
        floor: number;
    }
) => `P.${apartment.room_number} - Tầng ${apartment.floor}`;

const sendDepositPaidEmailAfterDepositPayment = async (
    invoice: InvoiceForPayment
) => {
    if (
        invoice.type !== InvoiceType.DEPOSIT
        || invoice.tenant.email === null
        || invoice.reservation === null
    ) {
        return;
    }

    const { reservation } = invoice;

    try {
        await sendReservationDepositPaidEmail({
            to: invoice.tenant.email,
            tenantName: invoice.tenant.full_name,
            invoiceCode: invoice.invoice_code,
            depositAmount: toNumber(invoice.total_amount),
            apartmentLabel: formatReservedApartmentLabel(
                reservation.apartment
            ),
            buildingAddress:
                reservation.apartment.building.address,
            moveInDeadline: reservation.expires_at
        });
    } catch {
        // Email lỗi không được làm rollback thanh toán đã ghi nhận.
    }
};

const getDepositPaidEmailSideEffects = (
    invoice: InvoiceForPayment
): PaymentSideEffect[] => (
    invoice.type === InvoiceType.DEPOSIT
    && invoice.tenant.email !== null
    && invoice.reservation !== null
        ? [
            {
                kind: "SEND_DEPOSIT_PAID_EMAIL",
                invoice
            }
        ]
        : []
);

const runPaymentSideEffects = async (
    sideEffects: PaymentSideEffect[]
) => {
    for (const sideEffect of sideEffects) {
        if (sideEffect.kind === "SEND_DEPOSIT_PAID_EMAIL") {
            await sendDepositPaidEmailAfterDepositPayment(
                sideEffect.invoice
            );
        }
    }
};

const applyPaidInvoiceSideEffects = async (
    transaction: Prisma.TransactionClient,
    invoice: InvoiceForPayment
): Promise<PaymentSideEffect[]> => {
    await createPaidNotification(transaction, invoice);

    if (
        invoice.type !== InvoiceType.DEPOSIT
        || invoice.reservation === null
        || invoice.reservation.status !== ReservationStatus.ACTIVE
    ) {
        return [];
    }

    await transaction.apartment.updateMany({
        where: {
            id: invoice.reservation.apartment_id,
            status: {
                in: [
                    ApartmentStatus.AVAILABLE,
                    ApartmentStatus.VACATING_SOON
                ]
            }
        },
        data: { status: ApartmentStatus.RESERVED }
    });

    return getDepositPaidEmailSideEffects(invoice);
};

const syncInvoicePaymentStatusByInvoiceId = async (
    transaction: Prisma.TransactionClient,
    invoiceId: number
): Promise<InvoicePaymentSyncResult> => {
    const invoice = await transaction.invoice.findUnique({
        where: { id: invoiceId },
        include: invoiceForPaymentInclude
    });

    if (!invoice) {
        throw notFound("invoice");
    }

    const paidAmountCents =
        getSuccessfulPaymentTotalCents(invoice);
    const totalAmountCents = toMoneyCents(
        toNumber(invoice.total_amount)
    );
    const isPaid =
        totalAmountCents > 0
        && paidAmountCents >= totalAmountCents;
    const desiredStatus = isPaid
        ? InvoiceStatus.PAID
        : InvoiceStatus.UNPAID;

    if (invoice.status === desiredStatus) {
        return {
            invoice,
            sideEffects: []
        };
    }

    let updated: InvoiceForPayment;

    try {
        updated = await transaction.invoice.update({
            where: {
                id: invoice.id,
                status: invoice.status
            },
            data: {
                status: desiredStatus,
                paid_at: isPaid ? new Date() : null
            },
            include: invoiceForPaymentInclude
        });
    } catch (error) {
        if (
            !(error instanceof
                Prisma.PrismaClientKnownRequestError)
            || error.code !== "P2025"
        ) {
            throw error;
        }

        const observed = await transaction.invoice.findUnique({
            where: { id: invoice.id },
            include: invoiceForPaymentInclude
        });

        if (!observed) {
            throw notFound("invoice");
        }

        if (observed.status === desiredStatus) {
            return {
                invoice: observed,
                sideEffects: []
            };
        }

        throw concurrentModification();
    }

    if (desiredStatus === InvoiceStatus.PAID) {
        return {
            invoice: updated,
            sideEffects:
                await applyPaidInvoiceSideEffects(
                    transaction,
                    updated
                )
        };
    }

    return {
        invoice: updated,
        sideEffects: []
    };
};

const syncInvoicePaymentStatus = async (
    transaction: Prisma.TransactionClient,
    invoiceId: number,
    actor: Actor
): Promise<InvoicePaymentSyncResult> => {
    const scopedWhere = getScopedInvoiceWhere(invoiceId, actor);
    const invoice = await transaction.invoice.findFirst({
        where: scopedWhere,
        select: { id: true }
    });

    if (!invoice) {
        throw notFound("invoice");
    }

    return syncInvoicePaymentStatusByInvoiceId(
        transaction,
        invoice.id
    );
};

const mapPaymentWriteError = (error: unknown): never => {
    if (
        error instanceof Prisma.PrismaClientKnownRequestError
        && error.code === "P2002"
    ) {
        throw new AppError(
            409,
            "TRANSACTION_CODE_CONFLICT",
            "Mã giao dịch đã tồn tại"
        );
    }

    throw error;
};

export const getPaymentsService = async (
    filters: PaymentFilters,
    actor: Actor
) => {
    const skip = (filters.page - 1) * filters.limit;
    const scope = getPaymentScopeWhere(actor);
    const andFilters: Prisma.PaymentWhereInput[] =
        actor.role === Role.ADMIN ? [] : [scope];

    if (filters.status !== undefined) {
        andFilters.push({ status: filters.status });
    }

    if (filters.payment_method !== undefined) {
        andFilters.push({
            payment_method:
                normalizePaymentMethod(filters.payment_method)
        });
    }

    if (filters.invoice_id !== undefined) {
        andFilters.push({ invoice_id: filters.invoice_id });
    }

    if (filters.tenant_id !== undefined) {
        andFilters.push({
            invoice: { tenant_id: filters.tenant_id }
        });
    }

    if (filters.contract_id !== undefined) {
        andFilters.push({
            invoice: { contract_id: filters.contract_id }
        });
    }

    if (filters.building_id !== undefined) {
        andFilters.push({
            OR: [
                {
                    invoice: {
                        contract: {
                            apartment: {
                                building_id: filters.building_id
                            }
                        }
                    }
                },
                {
                    invoice: {
                        reservation: {
                            apartment: {
                                building_id: filters.building_id
                            }
                        }
                    }
                }
            ]
        });
    }

    if (filters.search !== undefined) {
        andFilters.push({
            OR: [
                {
                    payment_method: {
                        contains: filters.search,
                        mode: "insensitive"
                    }
                },
                {
                    transaction_code: {
                        contains: filters.search,
                        mode: "insensitive"
                    }
                },
                {
                    invoice: {
                        invoice_code: {
                            contains: filters.search,
                            mode: "insensitive"
                        }
                    }
                },
                {
                    invoice: {
                        tenant: {
                            full_name: {
                                contains: filters.search,
                                mode: "insensitive"
                            }
                        }
                    }
                },
                {
                    invoice: {
                        contract: {
                            tenant: {
                                full_name: {
                                    contains: filters.search,
                                    mode: "insensitive"
                                }
                            }
                        }
                    }
                }
            ]
        });
    }

    const where: Prisma.PaymentWhereInput =
        andFilters.length === 0
            ? {}
            : { AND: andFilters };
    const [payments, total] = await prisma.$transaction([
        prisma.payment.findMany({
            where,
            skip,
            take: filters.limit,
            orderBy: { paid_at: "desc" },
            include: paymentInclude
        }),
        prisma.payment.count({ where })
    ]);

    return {
        data: payments.map(normalizePayment),
        pagination: {
            total,
            page: filters.page,
            limit: filters.limit,
            totalPages: Math.ceil(total / filters.limit)
        }
    };
};

export const getPaymentByIdService = async (
    id: number,
    actor: Actor
) => {
    const payment = await prisma.payment.findFirst({
        where: getScopedPaymentWhere(id, actor),
        include: paymentInclude
    });

    if (!payment) {
        throw notFound("payment");
    }

    return normalizePayment(payment);
};

export const createPaymentService = async (
    input: CreatePaymentInput,
    actor: Actor
) => {
    if (actor.role === Role.TENANT) {
        throw new AppError(
            403,
            "FORBIDDEN",
            "Khách thuê chỉ có thể thanh toán trực tuyến qua VNPay"
        );
    }

    const paymentMethod = normalizePaymentMethod(
        input.payment_method
    );
    const status = input.status ?? PaymentStatus.SUCCESS;

    if (
        input.amount !== undefined
        && !isDecimal12_2Amount(input.amount)
    ) {
        throw validationError(
            "Số tiền thanh toán phải đúng định dạng Decimal(12,2)"
        );
    }

    try {
        const result = await runSerializableTransaction(
            async (transaction) => {
                const invoiceWhere = getScopedInvoiceWhere(
                    input.invoice_id,
                    actor
                );
                const invoice =
                    await transaction.invoice.findFirst({
                        where: invoiceWhere,
                        include: invoiceForPaymentInclude
                    });

                if (!invoice) {
                    throw notFound("invoice");
                }

                if (invoice.status === InvoiceStatus.PAID) {
                    throw new AppError(
                        409,
                        "INVOICE_ALREADY_PAID",
                        "Hóa đơn đã được thanh toán"
                    );
                }

                const totalAmountCents = toMoneyCents(
                    toNumber(invoice.total_amount)
                );
                const paidAmountCents =
                    getSuccessfulPaymentTotalCents(invoice);
                const remainingAmountCents = Math.max(
                    totalAmountCents - paidAmountCents,
                    0
                );
                const remainingAmount =
                    remainingAmountCents / 100;
                const amount =
                    input.amount ?? remainingAmount;

                if (!isDecimal12_2Amount(amount)) {
                    throw validationError(
                        "Số tiền thanh toán phải đúng định dạng Decimal(12,2)"
                    );
                }

                const amountCents = toMoneyCents(amount);

                if (amountCents > remainingAmountCents) {
                    throw validationError(
                        "Số tiền thanh toán vượt quá số tiền còn lại của hóa đơn"
                    );
                }

                if (status === PaymentStatus.SUCCESS) {
                    assertSuccessAmountWithinInvoice(
                        invoice,
                        amount
                    );
                }

                const paidAt = status === PaymentStatus.SUCCESS
                    ? new Date()
                    : null;
                const transactionCode = input.transaction_code
                    ?? (
                        paymentMethod === PAYMENT_METHODS.CASH
                            ? generateCashTransactionCode(
                                invoice.id,
                                paidAt ?? new Date()
                            )
                            : undefined
                    );
                let created;

                try {
                    created = await transaction.payment.create({
                        data: {
                            invoice: {
                                connect: { id: invoice.id }
                            },
                            payment_method: paymentMethod,
                            transaction_code: transactionCode,
                            amount,
                            status,
                            paid_at: paidAt
                        }
                    });
                } catch (error) {
                    if (
                        error instanceof
                            Prisma.PrismaClientKnownRequestError
                        && error.code === "P2025"
                    ) {
                        throw notFound("invoice");
                    }

                    throw error;
                }

                const syncResult = await syncInvoicePaymentStatus(
                    transaction,
                    input.invoice_id,
                    actor
                );

                return {
                    payment: await findPaymentInScope(
                        transaction,
                        created.id,
                        actor
                    ),
                    sideEffects: syncResult.sideEffects
                };
            }
        );

        await runPaymentSideEffects(result.sideEffects);

        return normalizePayment(result.payment);
    } catch (error) {
        return mapPaymentWriteError(error);
    }
};

const generateVnpayTxnRef = (invoiceId: number) =>
    `VNPAY_${invoiceId}_${Date.now()}`;

export const createVnpayPaymentUrlService = async (
    input: CreateVnpayPaymentInput,
    actor: Actor,
    ipAddress: string
) => {
    if (!canCreateVnpayPaymentUrlForRole(actor.role)) {
        throw new AppError(
            403,
            "FORBIDDEN",
            "Không có quyền tạo liên kết thanh toán VNPay"
        );
    }

    const config = getVnpayConfig();

    const result = await runSerializableTransaction(
        async (transaction) => {
            const invoiceWhere = getScopedInvoiceWhere(
                input.invoice_id,
                actor
            );

            const invoice = await transaction.invoice.findFirst({
                where: invoiceWhere,
                include: invoiceForPaymentInclude
            });

            if (!invoice) {
                throw notFound("invoice");
            }

            if (invoice.status === InvoiceStatus.PAID) {
                throw new AppError(
                    409,
                    "INVOICE_ALREADY_PAID",
                    "Hóa đơn đã được thanh toán"
                );
            }

            const totalAmountCents = toMoneyCents(
                toNumber(invoice.total_amount)
            );
            const paidAmountCents =
                getSuccessfulPaymentTotalCents(invoice);
            const remainingAmountCents = Math.max(
                totalAmountCents - paidAmountCents,
                0
            );

            if (remainingAmountCents <= 0) {
                await syncInvoicePaymentStatusByInvoiceId(
                    transaction,
                    invoice.id
                );

                throw new AppError(
                    409,
                    "INVOICE_ALREADY_PAID",
                    "Hóa đơn đã được thanh toán"
                );
            }

            const transactionCode =
                generateVnpayTxnRef(invoice.id);

            await transaction.payment.updateMany({
                where: {
                    invoice_id: invoice.id,
                    payment_method: PAYMENT_METHODS.E_WALLET,
                    status: PaymentStatus.PENDING,
                    transaction_code: {
                        startsWith: "VNPAY_"
                    }
                },
                data: {
                    status: PaymentStatus.FAILED,
                    paid_at: null
                }
            });

            const payment = await transaction.payment.create({
                data: {
                    invoice: {
                        connect: { id: invoice.id }
                    },
                    payment_method: PAYMENT_METHODS.E_WALLET,
                    transaction_code: transactionCode,
                    amount: remainingAmountCents / 100,
                    status: PaymentStatus.PENDING,
                    paid_at: null
                }
            });

            return {
                invoice,
                payment,
                amountForVnpay: remainingAmountCents
            };
        }
    );

    const paymentUrl = buildVnpayPaymentUrl(
    config.paymentUrl,
    {
        vnp_Version: "2.1.0",
        vnp_Command: "pay",
        vnp_TmnCode: config.tmnCode,
        vnp_Amount: result.amountForVnpay,
        vnp_CurrCode: "VND",
        vnp_TxnRef: result.payment.transaction_code,
        vnp_OrderInfo:
            `Thanh toan hoa don ${result.invoice.invoice_code}`,
        vnp_OrderType: "other",
        vnp_Locale: "vn",
        vnp_ReturnUrl: config.returnUrl,
        vnp_IpAddr: ipAddress,
        vnp_CreateDate: formatVnpayDate(),
        vnp_BankCode: input.bank_code
    },
    config.hashSecret
);

    const qrCodeDataUrl = await generateQrCodeDataUrl(
        paymentUrl
    );

    const qrCodeSvg = await generateQrCodeSvg(
        paymentUrl
    );

    return {
        payment_id: result.payment.id,
        invoice_id: result.invoice.id,
        transaction_code: result.payment.transaction_code,
        payment_method: PAYMENT_METHODS.E_WALLET,
        amount: toNumber(result.payment.amount),
        payment_url: paymentUrl,
        qr_code_data_url: qrCodeDataUrl,
        qr_code_svg: qrCodeSvg
    };
};

export const createVnpayPaymentUrlFromDepositTokenService = async (
    token: string,
    ipAddress: string
) => {
    const invoiceId = verifyDepositPaymentToken(token);
    const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        select: {
            id: true,
            tenant_id: true,
            type: true,
            status: true,
            tenant: {
                select: {
                    user_id: true
                }
            },
            reservation: {
                select: {
                    status: true,
                    expires_at: true
                }
            }
        }
    });

    if (
        !invoice
        || invoice.type !== InvoiceType.DEPOSIT
        || invoice.reservation === null
    ) {
        throw invalidDepositPaymentToken();
    }

    if (invoice.status === InvoiceStatus.PAID) {
        throw new AppError(
            409,
            "INVOICE_ALREADY_PAID",
            "Hóa đơn đã được thanh toán"
        );
    }

    if (
        invoice.reservation.status !== ReservationStatus.ACTIVE
        || invoice.reservation.expires_at < new Date()
    ) {
        throw new AppError(
            409,
            "RESERVATION_EXPIRED",
            "Đặt cọc đã hết hạn hoặc không còn hiệu lực"
        );
    }

    return createVnpayPaymentUrlService(
        { invoice_id: invoice.id },
        {
            userId: invoice.tenant.user_id ?? 0,
            role: Role.TENANT,
            status: UserStatus.INACTIVE,
            tenantId: invoice.tenant_id
        },
        ipAddress
    );
};
export const updatePaymentStatusService = async (
    id: number,
    status: PaymentStatus,
    actor: Actor
) => {
    assertCanManagePayments(actor);

    try {
        const result = await runSerializableTransaction(
            async (transaction) => {
                const current = await findPaymentInScope(
                    transaction,
                    id,
                    actor
                );

                if (current.status === status) {
                    return {
                        payment: current,
                        sideEffects: []
                    };
                }

                if (
                    current.status === PaymentStatus.SUCCESS
                    && status !== PaymentStatus.SUCCESS
                ) {
                    return {
                        payment: current,
                        sideEffects: []
                    };
                }

                if (status === PaymentStatus.SUCCESS) {
                    assertSuccessAmountWithinInvoice(
                        current.invoice,
                        toNumber(current.amount),
                        current.id
                    );
                }

                try {
                    await transaction.payment.update({
                        where: {
                            ...getScopedPaymentWhere(id, actor),
                            status: current.status
                        },
                        data: {
                            status,
                            paid_at:
                                status === PaymentStatus.SUCCESS
                                    ? new Date()
                                    : null
                        }
                    });
                } catch (error) {
                    if (
                        !(error instanceof
                            Prisma.PrismaClientKnownRequestError)
                        || error.code !== "P2025"
                    ) {
                        throw error;
                    }

                    const observed =
                        await transaction.payment.findFirst({
                            where: getScopedPaymentWhere(
                                id,
                                actor
                            ),
                            include: paymentInclude
                        });

                    if (!observed) {
                        throw notFound("payment");
                    }

                    if (observed.status === status) {
                        const syncResult =
                            await syncInvoicePaymentStatus(
                                transaction,
                                observed.invoice_id,
                                actor
                            );

                        return {
                            payment: observed,
                            sideEffects: syncResult.sideEffects
                        };
                    }

                    throw concurrentModification();
                }

                const syncResult = await syncInvoicePaymentStatus(
                    transaction,
                    current.invoice_id,
                    actor
                );

                return {
                    payment: await findPaymentInScope(
                        transaction,
                        id,
                        actor
                    ),
                    sideEffects: syncResult.sideEffects
                };
            }
        );

        await runPaymentSideEffects(result.sideEffects);

        return normalizePayment(result.payment);
    } catch (error) {
        return mapPaymentWriteError(error);
    }
};
type VnpayCallbackSource = "RETURN" | "IPN";

type VnpayReturnStatus =
    | "SUCCESS"
    | "FAILED"
    | "INVALID_SIGNATURE"
    | "ORDER_NOT_FOUND"
    | "INVALID_AMOUNT";

export type VnpayReturnCallbackResult = {
    kind: "RETURN";
    success: boolean;
    status: VnpayReturnStatus;
    invoice_id: number | null;
    payment_id: number | null;
    transaction_code?: string;
    response_code?: string;
};

export type VnpayIpnCallbackResult = {
    kind: "IPN";
    RspCode: string;
    Message: string;
};

export type VnpayCallbackResult =
    | VnpayReturnCallbackResult
    | VnpayIpnCallbackResult;

const getVnpayIpnResponse = (
    code: string,
    message: string
): VnpayIpnCallbackResult => ({
    kind: "IPN",
    RspCode: code,
    Message: message
});

const getVnpayReturnResponse = (
    input: Omit<VnpayReturnCallbackResult, "kind">
): VnpayReturnCallbackResult => ({
    kind: "RETURN",
    ...input
});

type VnpayCallbackTransactionResult = {
    alreadyUpdated: boolean;
    invalidAmount: boolean;
    payment: {
        id: number;
        invoice_id: number;
        status: PaymentStatus;
    };
    sideEffects: PaymentSideEffect[];
};

const canApplySuccessAmount = (
    payment: PaymentWithRelations
) => {
    try {
        assertSuccessAmountWithinInvoice(
            payment.invoice,
            toNumber(payment.amount),
            payment.id
        );

        return true;
    } catch (error) {
        if (
            error instanceof AppError
            && error.code === "VALIDATION_ERROR"
        ) {
            return false;
        }

        throw error;
    }
};

const shouldApplyVnpayStatus = (
    currentStatus: PaymentStatus,
    targetStatus: PaymentStatus
) => {
    if (currentStatus === PaymentStatus.SUCCESS) {
        return false;
    }

    if (currentStatus === PaymentStatus.FAILED) {
        return targetStatus === PaymentStatus.SUCCESS;
    }

    return currentStatus === PaymentStatus.PENDING;
};

export const handleVnpayCallbackService = async (
    rawQuery: Record<string, unknown>,
    source: VnpayCallbackSource
): Promise<VnpayCallbackResult> => {
    const config = getVnpayConfig();
    const params = normalizeVnpayCallbackParams(rawQuery);

    const isValidSignature = verifyVnpaySecureHash(
        params,
        config.hashSecret
    );

    if (!isValidSignature) {
        if (source === "IPN") {
            return getVnpayIpnResponse(
                "97",
                "Chữ ký không hợp lệ"
            );
        }

        return getVnpayReturnResponse({
            success: false,
            status: "INVALID_SIGNATURE",
            invoice_id: null,
            payment_id: null
        });
    }

    const transactionCode = params.vnp_TxnRef;
    const vnpAmount = Number(params.vnp_Amount);
    const responseCode = params.vnp_ResponseCode;
    const transactionStatus = params.vnp_TransactionStatus;

    if (!transactionCode) {
        if (source === "IPN") {
            return getVnpayIpnResponse(
                "01",
                "Không tìm thấy đơn hàng"
            );
        }

        return getVnpayReturnResponse({
            success: false,
            status: "ORDER_NOT_FOUND",
            invoice_id: null,
            payment_id: null
        });
    }

    const payment = await prisma.payment.findUnique({
        where: { transaction_code: transactionCode },
        include: paymentInclude
    });

    if (!payment) {
        if (source === "IPN") {
            return getVnpayIpnResponse(
                "01",
                "Không tìm thấy đơn hàng"
            );
        }

        return getVnpayReturnResponse({
            success: false,
            status: "ORDER_NOT_FOUND",
            invoice_id: null,
            payment_id: null
        });
    }

    const expectedAmountForVnpay =
        toMoneyCents(toNumber(payment.amount));

    if (vnpAmount !== expectedAmountForVnpay) {
        if (source === "IPN") {
            return getVnpayIpnResponse(
                "04",
                "Số tiền không hợp lệ"
            );
        }

        return getVnpayReturnResponse({
            success: false,
            status: "INVALID_AMOUNT",
            invoice_id: payment.invoice_id,
            payment_id: payment.id
        });
    }

    const isPaymentSuccess =
        responseCode === "00"
        && transactionStatus === "00";

    const targetStatus = isPaymentSuccess
        ? PaymentStatus.SUCCESS
        : PaymentStatus.FAILED;

    const callbackResult = await runSerializableTransaction(
    async (transaction): Promise<VnpayCallbackTransactionResult> => {
        const current = await transaction.payment.findUnique({
            where: { id: payment.id }
        });

        if (!current) {
            throw notFound("payment");
        }

        if (!shouldApplyVnpayStatus(current.status, targetStatus)) {
            const syncResult = await syncInvoicePaymentStatusByInvoiceId(
                transaction,
                current.invoice_id
            );

            return {
                alreadyUpdated: true,
                invalidAmount: false,
                payment: current,
                sideEffects: syncResult.sideEffects
            };
        }

        if (
            targetStatus === PaymentStatus.SUCCESS
            && !canApplySuccessAmount(payment)
        ) {
            return {
                alreadyUpdated: false,
                invalidAmount: true,
                payment: current,
                sideEffects: []
            };
        }

        const updated = await transaction.payment.update({
            where: {
                id: current.id,
                status: current.status
            },
            data: {
                status: targetStatus,
                paid_at: isPaymentSuccess
                    ? new Date()
                    : null
            }
        });

        const syncResult = await syncInvoicePaymentStatusByInvoiceId(
            transaction,
            current.invoice_id
        );

        return {
            alreadyUpdated: false,
            invalidAmount: false,
            payment: updated,
            sideEffects: syncResult.sideEffects
        };
    });

    await runPaymentSideEffects(callbackResult.sideEffects);

    if (callbackResult.invalidAmount) {
        if (source === "IPN") {
            return getVnpayIpnResponse(
                "04",
                "Số tiền không hợp lệ."
            );
        }

        return getVnpayReturnResponse({
            success: false,
            status: "INVALID_AMOUNT",
            invoice_id: payment.invoice_id,
            payment_id: payment.id,
            transaction_code: transactionCode,
            response_code: responseCode
        });
    }

    if (source === "IPN") {
        if (callbackResult.alreadyUpdated) {
            return getVnpayIpnResponse(
                "02",
                "Đơn hàng đã được xác nhận"
            );
        }

        return getVnpayIpnResponse(
            "00",
            "Xác nhận thành công"
        );
    }

    const finalStatus = callbackResult.payment.status;

    return getVnpayReturnResponse({
        success: finalStatus === PaymentStatus.SUCCESS,
        status: finalStatus === PaymentStatus.SUCCESS
            ? PaymentStatus.SUCCESS
            : PaymentStatus.FAILED,
        invoice_id: payment.invoice_id,
        payment_id: payment.id,
        transaction_code: transactionCode,
        response_code: responseCode
    });
};
