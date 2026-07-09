import {
    InvoiceStatus,
    PaymentStatus,
    Prisma,
    Role
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
import { getCurrentManagerAssignment } from "../utils/manager-scope.js";
import {
    buildVnpayPaymentUrl,
    formatVnpayDate,
    getVnpayConfig,
    normalizeVnpayCallbackParams,
    verifyVnpaySecureHash
} from "../utils/vnpay.js";
import {
    generateQrCodeDataUrl,
    generateQrCodeSvg
} from "../utils/qrcode.js";
export type PaymentActor = Actor;
export type PaymentFilters = ListPaymentsRequest["query"];
export type CreatePaymentInput = CreatePaymentRequest["body"];
export type CreateVnpayPaymentInput = CreateVnpayPaymentRequest["body"];

export const PAYMENT_METHODS = {
    BANK_TRANSFER: "BANK_TRANSFER",
    E_WALLET: "E_WALLET"
} as const;

type PaymentMethod =
    typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];

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

const notFound = (resource: "invoice" | "payment") =>
    new AppError(
        404,
        "NOT_FOUND",
        resource === "invoice"
            ? "Invoice was not found"
            : "Payment was not found"
    );

const validationError = (message: string) =>
    new AppError(400, "VALIDATION_ERROR", message);

const concurrentModification = () =>
    new AppError(
        409,
        "CONCURRENT_MODIFICATION",
        "Payment changed during this operation"
    );

const SERIALIZABLE_RETRY_LIMIT = 3;

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
                    Prisma.TransactionIsolationLevel.Serializable
            });
        } catch (error) {
            const isSerializationConflict =
                error instanceof
                    Prisma.PrismaClientKnownRequestError
                && error.code === "P2034";

            if (!isSerializationConflict) {
                throw error;
            }

            if (attempt === SERIALIZABLE_RETRY_LIMIT) {
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

    return {
        ...invoice,
        total_amount: totalAmount,
        paid_amount: paidAmountCents / 100,
        remaining_amount:
            Math.max(totalAmountCents - paidAmountCents, 0)
            / 100,
        contract: {
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
    BANK_TRANSFER: PAYMENT_METHODS.BANK_TRANSFER,
    CHUYEN_KHOAN: PAYMENT_METHODS.BANK_TRANSFER,
    TRANSFER: PAYMENT_METHODS.BANK_TRANSFER,
    E_WALLET: PAYMENT_METHODS.E_WALLET,
    EWALLET: PAYMENT_METHODS.E_WALLET,
    ELECTRONIC_WALLET: PAYMENT_METHODS.E_WALLET,
    VI_DIEN_TU: PAYMENT_METHODS.E_WALLET,
    VNPAY: PAYMENT_METHODS.E_WALLET
};

const normalizePaymentMethod = (value: string) => {
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

const requireTenantId = (actor: Actor) => {
    if (actor.tenantId === undefined) {
        throw new AppError(
            403,
            "TENANT_PROFILE_REQUIRED",
            "A linked tenant profile is required"
        );
    }

    return actor.tenantId;
};

const getManagerApartmentScope = (actor: Actor) => {
    const assignment = getCurrentManagerAssignment(actor);

    return {
        building_id: assignment.buildingId,
        building: assignment.assignmentWhere
    } satisfies Prisma.ApartmentWhereInput;
};

const getInvoiceScopeWhere = (
    actor: Actor
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

    throw new AppError(
        403,
        "FORBIDDEN",
        "Payment access is forbidden"
    );
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
            contract: {
                apartment: getManagerApartmentScope(actor)
            }
        } satisfies Prisma.InvoiceWhereUniqueInput;
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
            invoice: {
                contract: {
                    apartment: getManagerApartmentScope(actor)
                }
            }
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
            "Payment management is forbidden"
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
            "Successful payment total exceeds the invoice total"
        );
    }
};

const createPaidNotification = async (
    transaction: Prisma.TransactionClient,
    invoice: InvoiceForPayment
) => {
    const userId = invoice.contract.tenant.user_id;

    if (userId === null) {
        return;
    }

    await transaction.notification.create({
        data: {
            user_id: userId,
            title: "Hoa don da thanh toan",
            content:
                `Hoa don ${invoice.invoice_code} `
                + "da duoc ghi nhan thanh toan.",
            type: "INVOICE_PAID"
        }
    });
};

const syncInvoicePaymentStatusByInvoiceId = async (
    transaction: Prisma.TransactionClient,
    invoiceId: number
) => {
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
        return invoice;
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
            return observed;
        }

        throw concurrentModification();
    }

    if (desiredStatus === InvoiceStatus.PAID) {
        await createPaidNotification(transaction, updated);
    }

    return updated;
};

const syncInvoicePaymentStatus = async (
    transaction: Prisma.TransactionClient,
    invoiceId: number,
    actor: Actor
) => {
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
            "Transaction code already exists"
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
            invoice: {
                contract: {
                    apartment: {
                        building_id: filters.building_id
                    }
                }
            }
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
    const paymentMethod = normalizePaymentMethod(
        input.payment_method
    );
    const status = input.status
        ?? (
            actor.role === Role.TENANT
                ? PaymentStatus.PENDING
                : PaymentStatus.SUCCESS
        );

    if (
        actor.role === Role.TENANT
        && status !== PaymentStatus.PENDING
    ) {
        throw new AppError(
            403,
            "FORBIDDEN",
            "Tenants may only create pending payments"
        );
    }

    if (
        input.amount !== undefined
        && !isDecimal12_2Amount(input.amount)
    ) {
        throw validationError(
            "Payment amount must be a valid Decimal(12,2) amount"
        );
    }

    try {
        const payment = await runSerializableTransaction(
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
                        "Invoice is already paid"
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
                        "Payment amount must be a valid Decimal(12,2) amount"
                    );
                }

                const amountCents = toMoneyCents(amount);

                if (amountCents > remainingAmountCents) {
                    throw validationError(
                        "Payment amount exceeds the remaining balance"
                    );
                }

                if (status === PaymentStatus.SUCCESS) {
                    assertSuccessAmountWithinInvoice(
                        invoice,
                        amount
                    );
                }

                let created;

                try {
                    created = await transaction.payment.create({
                        data: {
                            invoice: {
                                connect: invoiceWhere
                            },
                            payment_method: paymentMethod,
                            transaction_code:
                                input.transaction_code,
                            amount,
                            status
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

                await syncInvoicePaymentStatus(
                    transaction,
                    input.invoice_id,
                    actor
                );

                return findPaymentInScope(
                    transaction,
                    created.id,
                    actor
                );
            }
        );

        return normalizePayment(payment);
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
    if (actor.role !== Role.TENANT) {
        throw new AppError(
            403,
            "FORBIDDEN",
            "Only tenants can pay invoices online"
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
                    "Invoice is already paid"
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
                throw new AppError(
                    409,
                    "INVOICE_ALREADY_PAID",
                    "Invoice has no remaining balance"
                );
            }

            const transactionCode =
                generateVnpayTxnRef(invoice.id);

            const payment = await transaction.payment.create({
                data: {
                    invoice: {
                        connect: invoiceWhere
                    },
                    payment_method: PAYMENT_METHODS.E_WALLET,
                    transaction_code: transactionCode,
                    amount: remainingAmountCents / 100,
                    status: PaymentStatus.PENDING
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

export const updatePaymentStatusService = async (
    id: number,
    status: PaymentStatus,
    actor: Actor
) => {
    assertCanManagePayments(actor);

    try {
        const payment = await runSerializableTransaction(
            async (transaction) => {
                const current = await findPaymentInScope(
                    transaction,
                    id,
                    actor
                );

                if (current.status === status) {
                    return current;
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
                                    : current.paid_at
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
                        return observed;
                    }

                    throw concurrentModification();
                }

                await syncInvoicePaymentStatus(
                    transaction,
                    current.invoice_id,
                    actor
                );

                return findPaymentInScope(
                    transaction,
                    id,
                    actor
                );
            }
        );

        return normalizePayment(payment);
    } catch (error) {
        return mapPaymentWriteError(error);
    }
};
type VnpayCallbackSource = "RETURN" | "IPN";

const getVnpayIpnResponse = (
    code: string,
    message: string
) => ({
    RspCode: code,
    Message: message
});

export const handleVnpayCallbackService = async (
    rawQuery: Record<string, unknown>,
    source: VnpayCallbackSource
) => {
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
                "Invalid signature"
            );
        }

        return {
            success: false,
            status: "INVALID_SIGNATURE",
            invoice_id: null,
            payment_id: null
        };
    }

    const transactionCode = params.vnp_TxnRef;
    const vnpAmount = Number(params.vnp_Amount);
    const responseCode = params.vnp_ResponseCode;
    const transactionStatus = params.vnp_TransactionStatus;

    if (!transactionCode) {
        if (source === "IPN") {
            return getVnpayIpnResponse(
                "01",
                "Order not found"
            );
        }

        return {
            success: false,
            status: "ORDER_NOT_FOUND",
            invoice_id: null,
            payment_id: null
        };
    }

    const payment = await prisma.payment.findUnique({
        where: { transaction_code: transactionCode },
        include: paymentInclude
    });

    if (!payment) {
        if (source === "IPN") {
            return getVnpayIpnResponse(
                "01",
                "Order not found"
            );
        }

        return {
            success: false,
            status: "ORDER_NOT_FOUND",
            invoice_id: null,
            payment_id: null
        };
    }

    const expectedAmountForVnpay =
        toMoneyCents(toNumber(payment.amount));

    if (vnpAmount !== expectedAmountForVnpay) {
        if (source === "IPN") {
            return getVnpayIpnResponse(
                "04",
                "Invalid amount"
            );
        }

        return {
            success: false,
            status: "INVALID_AMOUNT",
            invoice_id: payment.invoice_id,
            payment_id: payment.id
        };
    }

    const isPaymentSuccess =
        responseCode === "00"
        && transactionStatus === "00";

    const targetStatus = isPaymentSuccess
        ? PaymentStatus.SUCCESS
        : PaymentStatus.FAILED;

    const callbackResult = await runSerializableTransaction(
        async (transaction) => {
            const current = await transaction.payment.findUnique({
                where: { id: payment.id }
            });

            if (!current) {
                throw notFound("payment");
            }

            if (current.status !== PaymentStatus.PENDING) {
                return {
                    alreadyUpdated: true,
                    payment: current
                };
            }

            await transaction.payment.update({
                where: {
                    id: current.id,
                    status: PaymentStatus.PENDING
                },
                data: {
                    status: targetStatus,
                    paid_at: isPaymentSuccess
                        ? new Date()
                        : current.paid_at
                }
            });

            await syncInvoicePaymentStatusByInvoiceId(
                transaction,
                current.invoice_id
            );

            const updated = await transaction.payment.findUnique({
                where: { id: current.id }
            });

            if (!updated) {
                throw notFound("payment");
            }

            return {
                alreadyUpdated: false,
                payment: updated
            };
        }
    );

    if (source === "IPN") {
        if (callbackResult.alreadyUpdated) {
            return getVnpayIpnResponse(
                "02",
                "Order already confirmed"
            );
        }

        return getVnpayIpnResponse(
            "00",
            "Confirm Success"
        );
    }

    return {
        success: isPaymentSuccess,
        status: isPaymentSuccess ? "SUCCESS" : "FAILED",
        invoice_id: payment.invoice_id,
        payment_id: payment.id,
        transaction_code: transactionCode,
        response_code: responseCode
    };
};
