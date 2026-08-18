import {
    ApartmentStatus,
    ContractStatus,
    ContractTerminationStatus,
    ContractTerminationType,
    DepositPolicy,
    InvoiceStatus,
    InvoiceType,
    Prisma,
    Role,
    UserStatus,
} from "@prisma/client";
import { prisma } from "../config/database.js";
import { AppError } from "../errors/app-error.js";
import type {
    CompleteHandoverRequest,
    CreateOverdueTerminationRequest,
    CreateTenantTerminationRequest,
    ListContractTerminationsRequest,
    PreviewSettlementRequest,
    UpdateInspectionRequest
} from "../schemas/contract-termination.schema.js";
import type { Actor } from "../types/auth.js";
import {
    calculateElectricAmount,
    calculateElectricTierDetails,
    calculateWaterAmount,
    calculateWaterTierDetails
} from "../utils/invoice-billing.js";
import { getManagerApartmentScope } from "../utils/manager-scope.js";
import { toMoneyCents } from "../utils/money.js";
import { runSerializableTransaction } from "../utils/prisma-transaction.js";
import {
    buildDepositRefundInvoiceTotal,
    calculateNoticeDays,
    calculateNoticePolicy,
    calculateSettlement,
    isInvoiceOverdueForTermination,
    shouldIncludeInvoiceInFinalSettlementDebt
} from "../utils/contract-termination.rules.js";

const openStatuses = [
    ContractTerminationStatus.PENDING,
    ContractTerminationStatus.APPROVED,
    ContractTerminationStatus.INSPECTION,
    ContractTerminationStatus.SETTLING
] as const;

const handoverCompletionStatuses = [
    ContractTerminationStatus.APPROVED,
    ContractTerminationStatus.INSPECTION,
    ContractTerminationStatus.SETTLING
] as const;

const contractInclude = {
    tenant: {
        select: {
            id: true,
            full_name: true,
            phone: true,
            email: true,
            citizen_id: true,
            user_id: true,
            _count: {
                select: { occupants: true }
            }
        }
    },
    apartment: {
        include: { building: true }
    }
} satisfies Prisma.RentalContractInclude;

const finalInvoiceInclude = {
    items: {
        orderBy: { id: "asc" }
    },
    payments: {
        select: {
            amount: true,
            status: true,
            paid_at: true
        },
        orderBy: { paid_at: "desc" }
    }
} satisfies Prisma.InvoiceInclude;

const terminationContractInclude = {
    ...contractInclude,
    invoices: {
        where: { type: InvoiceType.FINAL_SETTLEMENT },
        include: finalInvoiceInclude,
        orderBy: { created_at: "desc" },
        take: 1
    }
} satisfies Prisma.RentalContractInclude;

const terminationInclude = {
    contract: {
        include: terminationContractInclude
    }
} satisfies Prisma.ContractTerminationInclude;

type TerminationWithRelations = Prisma.ContractTerminationGetPayload<{
    include: typeof terminationInclude;
}>;

type FinalSettlementInvoice = Prisma.InvoiceGetPayload<{
    include: typeof finalInvoiceInclude;
}>;

type ChargeInput = Partial<{
    final_rent: number;
    final_electricity: number;
    final_water: number;
    final_service_fee: number;
    other_charges: number;
    final_electricity_old: number;
    final_electricity_new: number;
    final_water_old: number;
    final_water_new: number;
    deposit_policy: DepositPolicy;
    damage_items: Array<{ description: string; amount: number; note?: string }>;
}>;

const notFound = () => new AppError(
    404,
    "NOT_FOUND",
    "Yêu cầu thanh lý không tồn tại"
);

const invalidState = (message = "Trạng thái thanh lý không hợp lệ") =>
    new AppError(409, "TERMINATION_INVALID_STATE", message);

const concurrentModification = () => new AppError(
    409,
    "CONCURRENT_MODIFICATION",
    "Yêu cầu thanh lý đã bị thay đổi trong quá trình thực hiện"
);

const contractNotActive = () => new AppError(
    409,
    "CONTRACT_NOT_ACTIVE",
    "Chỉ có thể thanh lý hợp đồng đang hiệu lực"
);

const requireTenantId = (actor: Actor) => {
    if (actor.tenantId === undefined) {
        throw new AppError(
            403,
            "TENANT_PROFILE_REQUIRED",
            "Yêu cầu phải có hồ sơ khách thuê"
        );
    }

    return actor.tenantId;
};

const assertManagerOrAdmin = (actor: Actor) => {
    if (actor.role !== Role.ADMIN && actor.role !== Role.MANAGER) {
        throw new AppError(
            403,
            "FORBIDDEN",
            "Bạn không có quyền xử lý thanh lý hợp đồng"
        );
    }
};

const getTerminationScope = (
    actor: Actor
): Prisma.ContractTerminationWhereInput => {
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
            contract: {
                tenant_id: requireTenantId(actor)
            }
        };
    }

    throw new AppError(403, "FORBIDDEN", "Bạn không có quyền truy cập");
};

const getManagedContractScope = (actor: Actor): Prisma.RentalContractWhereInput => {
    if (actor.role === Role.ADMIN) {
        return {};
    }

    return {
        apartment: getManagerApartmentScope(actor)
    };
};

const startOfUtcDay = (date: Date) => new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
));

const toNumber = (value: Prisma.Decimal | number) => Number(value);

const moneyNumber = (value: number | Prisma.Decimal) =>
    new Prisma.Decimal(value).toDecimalPlaces(
        2,
        Prisma.Decimal.ROUND_HALF_UP
    ).toNumber();

const TERMINATION_NOTIFICATION_TYPE = "SYSTEM";

type TerminationNotificationContract = TerminationWithRelations["contract"];

const formatContractCode = (contractId: number) =>
    `HD-${String(contractId).padStart(5, "0")}`;

const formatDateVi = (date: Date | null | undefined) =>
    date ? date.toLocaleDateString("vi-VN", { timeZone: "UTC" }) : "-";

const formatMoneyVnd = (amount: number) =>
    `${Math.round(amount).toLocaleString("vi-VN")} đ`;

const getTerminationContractLabel = (contract: TerminationNotificationContract) => {
    const buildingName = contract.apartment.building.branch_name;
    const roomLabel = `P.${contract.apartment.room_number}`;

    return `${formatContractCode(contract.id)} tại ${roomLabel}${buildingName ? ` (${buildingName})` : ""}`;
};

const getReasonSuffix = (reason: string | null | undefined) => {
    const trimmedReason = reason?.trim();
    return trimmedReason ? ` Lý do: ${trimmedReason}` : "";
};

const createTerminationNotifications = async (
    transaction: Prisma.TransactionClient,
    userIds: Array<number | null | undefined>,
    title: string,
    content: string
) => {
    const ids = [
        ...new Set(userIds.filter((userId): userId is number =>
            typeof userId === "number"
        ))
    ];

    if (ids.length === 0) return;

    if (ids.length === 1) {
        await transaction.notification.create({
            data: {
                user_id: ids[0],
                title,
                content,
                type: TERMINATION_NOTIFICATION_TYPE
            }
        });
        return;
    }

    await transaction.notification.createMany({
        data: ids.map((userId) => ({
            user_id: userId,
            title,
            content,
            type: TERMINATION_NOTIFICATION_TYPE
        }))
    });
};

const getTerminationManagerNotificationUserIds = async (
    transaction: Prisma.TransactionClient,
    contract: TerminationNotificationContract
) => {
    const recipients = await transaction.user.findMany({
        where: {
            status: UserStatus.ACTIVE,
            OR: [
                { role: Role.ADMIN },
                {
                    role: Role.MANAGER,
                    staff: {
                        building_id: contract.apartment.building_id
                    }
                }
            ]
        },
        select: { id: true }
    });

    return recipients.map(({ id: userId }) => userId);
};

const notifyManagersOfTenantTerminationRequest = async (
    transaction: Prisma.TransactionClient,
    termination: TerminationWithRelations
) => {
    const recipientIds = await getTerminationManagerNotificationUserIds(
        transaction,
        termination.contract
    );
    const contractLabel = getTerminationContractLabel(termination.contract);

    await createTerminationNotifications(
        transaction,
        recipientIds,
        "Yêu cầu trả phòng mới",
        `Khách ${termination.contract.tenant.full_name} đã gửi yêu cầu trả phòng ${contractLabel}. Ngày đề xuất: ${formatDateVi(termination.requested_end_date)}.${getReasonSuffix(termination.reason)}`
    );
};

const notifyTenantOfTermination = async (
    transaction: Prisma.TransactionClient,
    termination: TerminationWithRelations,
    title: string,
    content: string
) => createTerminationNotifications(
    transaction,
    [termination.contract.tenant.user_id],
    title,
    content
);

const notifyTenantTerminationApproved = async (
    transaction: Prisma.TransactionClient,
    termination: TerminationWithRelations
) => notifyTenantOfTermination(
    transaction,
    termination,
    "Yêu cầu trả phòng đã được duyệt",
    `Yêu cầu trả phòng ${getTerminationContractLabel(termination.contract)} đã được duyệt. Ngày chấm dứt hiệu lực: ${formatDateVi(termination.effective_end_date ?? termination.requested_end_date)}.`
);

const notifyTenantTerminationRejected = async (
    transaction: Prisma.TransactionClient,
    termination: TerminationWithRelations,
    rejectedReason: string
) => notifyTenantOfTermination(
    transaction,
    termination,
    "Yêu cầu trả phòng bị từ chối",
    `Yêu cầu trả phòng ${getTerminationContractLabel(termination.contract)} đã bị từ chối.${getReasonSuffix(rejectedReason)}`
);

const notifyTenantProactiveTermination = async (
    transaction: Prisma.TransactionClient,
    termination: TerminationWithRelations
) => notifyTenantOfTermination(
    transaction,
    termination,
    "Hợp đồng được đưa vào thanh lý",
    `Quản lý đã đưa ${getTerminationContractLabel(termination.contract)} vào quy trình thanh lý.${getReasonSuffix(termination.reason)}`
);

const notifyTenantTerminationCancelled = async (
    transaction: Prisma.TransactionClient,
    termination: TerminationWithRelations
) => notifyTenantOfTermination(
    transaction,
    termination,
    "Thanh lý hợp đồng đã bị hủy",
    `Hồ sơ thanh lý ${getTerminationContractLabel(termination.contract)} đã bị hủy.`
);

const notifyTenantTerminationCompleted = async (
    transaction: Prisma.TransactionClient,
    termination: TerminationWithRelations,
    settlement: Pick<Awaited<ReturnType<typeof calculateSettlementForTermination>>, "additional_amount_due" | "refund_amount">,
    finalInvoice: Pick<FinalSettlementInvoice, "invoice_code"> | null
) => {
    const invoiceText = finalInvoice?.invoice_code
        ? ` Hóa đơn quyết toán: ${finalInvoice.invoice_code}.`
        : "";
    const amountText = settlement.additional_amount_due > 0
        ? ` Số tiền cần thanh toán: ${formatMoneyVnd(settlement.additional_amount_due)}.`
        : settlement.refund_amount > 0
            ? ` Số tiền hoàn cọc: ${formatMoneyVnd(settlement.refund_amount)}.`
            : "";

    await notifyTenantOfTermination(
        transaction,
        termination,
        "Thanh lý hợp đồng đã hoàn tất",
        `Hồ sơ thanh lý ${getTerminationContractLabel(termination.contract)} đã hoàn tất.${invoiceText}${amountText}`
    );
};

const normalizeFinalInvoice = (
    invoice: FinalSettlementInvoice | null | undefined
) => invoice === null || invoice === undefined ? null : {
    ...invoice,
    total_amount: toNumber(invoice.total_amount),
    items: (invoice.items ?? []).map((item) => ({
        ...item,
        quantity: toNumber(item.quantity),
        unit_price: toNumber(item.unit_price),
        amount: toNumber(item.amount)
    })),
    payments: (invoice.payments ?? []).map((payment) => ({
        ...payment,
        amount: toNumber(payment.amount)
    }))
};

const normalizeTermination = (termination: TerminationWithRelations) => {
    const contractWithInvoices = termination.contract as TerminationWithRelations["contract"] & {
        invoices?: FinalSettlementInvoice[];
    };
    const finalInvoice = contractWithInvoices.invoices?.[0] ?? null;
    const { invoices: _invoices, ...contract } = contractWithInvoices;

    return {
        ...termination,
        refund_rate: toNumber(termination.refund_rate),
        contract: {
            ...contract,
            deposit_amount: toNumber(contract.deposit_amount),
            monthly_rent: toNumber(contract.monthly_rent),
            apartment: {
                ...contract.apartment,
                area: toNumber(contract.apartment.area),
                rental_price: toNumber(contract.apartment.rental_price)
            }
        },
        final_invoice: normalizeFinalInvoice(finalInvoice)
    };
};

const findOpenTermination = (
    transaction: Prisma.TransactionClient,
    contractId: number
) => transaction.contractTermination.findFirst({
    where: {
        contract_id: contractId,
        status: { in: [...openStatuses] }
    },
    select: { id: true }
});

const assertNoOpenTermination = async (
    transaction: Prisma.TransactionClient,
    contractId: number
) => {
    if (await findOpenTermination(transaction, contractId)) {
        throw new AppError(
            409,
            "TERMINATION_ALREADY_EXISTS",
            "Hợp đồng đã có yêu cầu thanh lý chưa hoàn tất"
        );
    }
};

const mapTerminationWriteError = (error: unknown): never => {
    if (
        error instanceof Prisma.PrismaClientKnownRequestError
        && error.code === "P2002"
    ) {
        throw new AppError(
            409,
            "TERMINATION_ALREADY_EXISTS",
            "Hợp đồng đã có yêu cầu thanh lý chưa hoàn tất"
        );
    }

    throw error;
};

const getInvoiceRemainingCents = (invoice: {
    total_amount: Prisma.Decimal;
    payments: Array<{
        amount: Prisma.Decimal;
        status: string;
    }>;
}) => {
    const paidCents = invoice.payments
        .filter((payment) => payment.status === "SUCCESS")
        .reduce(
            (sum, payment) => sum + toMoneyCents(toNumber(payment.amount)),
            0
        );

    return Math.max(
        toMoneyCents(toNumber(invoice.total_amount)) - paidCents,
        0
    );
};

const getContractInvoicesWithPayments = (
    database: Pick<Prisma.TransactionClient, "invoice">,
    contractId: number
) => database.invoice.findMany({
    where: {
        contract_id: contractId,
        type: {
            in: Object.values(InvoiceType).filter(
                shouldIncludeInvoiceInFinalSettlementDebt
            )
        }
    },
    select: {
        id: true,
        due_date: true,
        total_amount: true,
        payments: {
            select: {
                amount: true,
                status: true
            }
        }
    }
});

const getOutstandingDebt = async (
    transaction: Prisma.TransactionClient,
    contractId: number
) => {
    const invoices = await getContractInvoicesWithPayments(
        transaction,
        contractId
    );

    return invoices.reduce(
        (sum, invoice) => sum + getInvoiceRemainingCents(invoice),
        0
    ) / 100;
};



const getOverdueDebtInfo = async (
    database: Pick<Prisma.TransactionClient, "invoice">,
    contractId: number,
    now = new Date()
) => {
    const invoices = await getContractInvoicesWithPayments(database, contractId);
    const overdueInvoices = invoices
        .map((invoice) => ({
            remainingCents: getInvoiceRemainingCents(invoice),
            isOverdue: isInvoiceOverdueForTermination(invoice.due_date, now)
        }))
        .filter((invoice) => invoice.remainingCents > 0 && invoice.isOverdue);

    return {
        amount: overdueInvoices.reduce(
            (sum, invoice) => sum + invoice.remainingCents,
            0
        ) / 100,
        invoice_count: overdueInvoices.length
    };
};
const getOccupantCount = (termination: TerminationWithRelations) =>
    1 + (termination.contract.tenant._count?.occupants ?? 0);
const getDepositPolicyValues = (
    termination: Pick<TerminationWithRelations, "deposit_policy" | "refund_rate" | "type">,
    depositPolicy: DepositPolicy | undefined
) => {
    if (termination.type === ContractTerminationType.OVERDUE) {
        return {
            deposit_policy: DepositPolicy.FORFEITED,
            refund_rate: 0,
            settlement_type: ContractTerminationType.OVERDUE
        };
    }

    if (depositPolicy === DepositPolicy.REFUNDABLE) {
        return {
            deposit_policy: DepositPolicy.REFUNDABLE,
            refund_rate: 100,
            settlement_type: ContractTerminationType.TENANT_REQUEST
        };
    }

    if (depositPolicy === DepositPolicy.FORFEITED) {
        return {
            deposit_policy: DepositPolicy.FORFEITED,
            refund_rate: 0,
            settlement_type: ContractTerminationType.TENANT_REQUEST
        };
    }

    return {
        deposit_policy: termination.deposit_policy,
        refund_rate: toNumber(termination.refund_rate),
        settlement_type: termination.type
    };
};

const buildDepositPolicyUpdate = (
    depositPolicy: DepositPolicy | undefined,
    terminationType?: ContractTerminationType
) => {
    if (terminationType === ContractTerminationType.OVERDUE) {
        return {
            deposit_policy: DepositPolicy.FORFEITED,
            refund_rate: 0
        };
    }

    if (depositPolicy === undefined) return {};

    return {
        deposit_policy: depositPolicy,
        refund_rate: depositPolicy === DepositPolicy.REFUNDABLE ? 100 : 0
    };
};

const meterCharge = (
    newer: number | undefined | null,
    older: number | undefined | null,
    calculate: (consumption: number) => number
) => newer === undefined
    || newer === null
    || older === undefined
    || older === null
    ? 0
    : calculate(Math.max(newer - older, 0));

const calculateSettlementForTermination = async (
    transaction: Prisma.TransactionClient,
    termination: TerminationWithRelations,
    input: ChargeInput = {}
) => {
    const outstandingDebt = await getOutstandingDebt(
        transaction,
        termination.contract.id
    );
    const occupantCount = getOccupantCount(termination);
    const finalElectricity = input.final_electricity
        ?? meterCharge(
            input.final_electricity_new,
            input.final_electricity_old,
            calculateElectricAmount
        );
    const finalWater = input.final_water
        ?? meterCharge(
            input.final_water_new,
            input.final_water_old,
            (consumption) => calculateWaterAmount(
                consumption,
                occupantCount
            )
        );
    const damageAmount = input.damage_items?.reduce(
        (sum, damage) => moneyNumber(sum + damage.amount),
        0
    ) ?? 0;
    const depositPolicyValues = getDepositPolicyValues(
        termination,
        input.deposit_policy
    );
    const result = calculateSettlement({
        terminationType: depositPolicyValues.settlement_type,
        depositPaid: termination.contract.deposit_amount,
        refundRate: depositPolicyValues.refund_rate,
        outstandingDebt,
        finalRent: input.final_rent ?? 0,
        finalElectricity,
        finalWater,
        finalServiceFee: input.final_service_fee ?? 0,
        otherCharges: input.other_charges ?? 0,
        damageAmount
    });

    return {
        deposit_paid: result.depositPaid,
        eligible_deposit: result.eligibleDeposit,
        outstanding_debt: moneyNumber(outstandingDebt),
        final_rent: moneyNumber(input.final_rent ?? 0),
        final_electricity: moneyNumber(finalElectricity),
        final_water: moneyNumber(finalWater),
        final_service_fee: moneyNumber(input.final_service_fee ?? 0),
        other_charges: moneyNumber(input.other_charges ?? 0),
        damage_amount: moneyNumber(damageAmount),
        deposit_applied: result.depositApplied,
        refund_amount: result.refundAmount,
        additional_amount_due: result.additionalAmountDue,
        financial_status: result.financialStatus
    };
};


const findTerminationInScope = async (
    database: Pick<Prisma.TransactionClient, "contractTermination">,
    id: number,
    actor: Actor
) => {
    const termination = await database.contractTermination.findFirst({
        where: {
            id,
            ...getTerminationScope(actor)
        },
        include: terminationInclude
    });

    if (!termination) {
        throw notFound();
    }

    return termination;
};

const buildFinalSettlementInvoiceCode = (terminationId: number) =>
    `SETTLEMENT-${terminationId}`;

const buildDepositRefundInvoiceCode = (terminationId: number) =>
    `REFUND-${terminationId}`;

const addInvoiceItem = (
    items: Prisma.InvoiceItemCreateWithoutInvoiceInput[],
    itemName: string,
    amount: number,
    quantity = 1,
    unitPrice = amount
) => {
    const roundedAmount = moneyNumber(amount);

    if (roundedAmount === 0) return;

    items.push({
        item_name: itemName,
        quantity: moneyNumber(quantity),
        unit_price: moneyNumber(unitPrice),
        amount: roundedAmount
    });
};

const meterConsumption = (
    newer: number | undefined | null,
    older: number | undefined | null
) => newer === undefined
    || newer === null
    || older === undefined
    || older === null
    ? null
    : Math.max(newer - older, 0);

const addUtilityTierItems = (
    items: Prisma.InvoiceItemCreateWithoutInvoiceInput[],
    itemName: string,
    amount: number,
    tierDetails: Array<{
        label: string;
        quantity: number;
        unit_price: number;
        amount: number;
    }> | null
) => {
    if (!tierDetails || tierDetails.length === 0) {
        addInvoiceItem(items, itemName, amount);
        return;
    }

    for (const detail of tierDetails) {
        addInvoiceItem(
            items,
            `${itemName} - ${detail.label}`,
            detail.amount,
            detail.quantity,
            detail.unit_price
        );
    }
};

const buildFinalSettlementInvoiceItems = (
    settlement: Awaited<ReturnType<typeof calculateSettlementForTermination>>,
    input: ChargeInput,
    occupantCount: number
) => {
    const items: Prisma.InvoiceItemCreateWithoutInvoiceInput[] = [];

    addInvoiceItem(
        items,
        "Công nợ hóa đơn chưa thanh toán",
        settlement.outstanding_debt
    );
    addInvoiceItem(items, "Tiền thuê cuối kỳ", settlement.final_rent);

    const electricConsumption = meterConsumption(
        input.final_electricity_new,
        input.final_electricity_old
    );
    addUtilityTierItems(
        items,
        "Tiền điện chốt",
        settlement.final_electricity,
        electricConsumption === null
            ? null
            : calculateElectricTierDetails(electricConsumption)
    );

    const waterConsumption = meterConsumption(
        input.final_water_new,
        input.final_water_old
    );
    addUtilityTierItems(
        items,
        "Tiền nước chốt",
        settlement.final_water,
        waterConsumption === null
            ? null
            : calculateWaterTierDetails(waterConsumption, occupantCount)
    );

    addInvoiceItem(items, "Phí dịch vụ cuối kỳ", settlement.final_service_fee);
    addInvoiceItem(items, "Khoản phát sinh khác", settlement.other_charges);

    if (input.damage_items !== undefined && input.damage_items.length > 0) {
        for (const damage of input.damage_items) {
            addInvoiceItem(
                items,
                `Bồi thường: ${damage.description}`,
                damage.amount
            );
        }
    } else {
        addInvoiceItem(
            items,
            "Cơ sở vật chất hư hại",
            settlement.damage_amount
        );
    }

    if (items.length === 0) {
        items.push({
            item_name: "Quyết toán thanh lý không phát sinh phải thu",
            quantity: 1,
            unit_price: 0,
            amount: 0
        });
    }

    return items;
};

const getSuccessfulPaymentCents = (
    invoice: Pick<FinalSettlementInvoice, "payments"> | null | undefined
) => (invoice?.payments ?? [])
    .filter((payment) => payment.status === "SUCCESS")
    .reduce(
        (sum, payment) => sum + toMoneyCents(toNumber(payment.amount)),
        0
    );

const getRuntimeFinancialStatus = (
    additionalAmountDue: number,
    invoice?: FinalSettlementInvoice | null
) => toMoneyCents(additionalAmountDue) > getSuccessfulPaymentCents(invoice)
    ? "AWAITING_PAYMENT" as const
    : "SETTLED" as const;

const saveFinalSettlementInvoice = async (
    transaction: Prisma.TransactionClient,
    termination: TerminationWithRelations,
    settlement: Awaited<ReturnType<typeof calculateSettlementForTermination>>,
    input: ChargeInput
) => {
    const invoiceCode = buildFinalSettlementInvoiceCode(termination.id);
    const existing = await transaction.invoice.findFirst({
        where: { invoice_code: invoiceCode },
        include: finalInvoiceInclude
    });
    const totalAmount = moneyNumber(settlement.additional_amount_due);
    const paidCents = getSuccessfulPaymentCents(existing);
    const status = toMoneyCents(totalAmount) <= paidCents
        ? InvoiceStatus.PAID
        : InvoiceStatus.UNPAID;
    const paidAt = status === InvoiceStatus.PAID
        ? existing?.paid_at ?? new Date()
        : null;
    const items = buildFinalSettlementInvoiceItems(
        settlement,
        input,
        getOccupantCount(termination)
    );

    if (existing) {
        await transaction.invoiceItem.deleteMany({
            where: { invoice_id: existing.id }
        });

        return transaction.invoice.update({
            where: { id: existing.id },
            data: {
                contract_id: termination.contract.id,
                tenant_id: termination.contract.tenant_id,
                due_date: existing.due_date,
                total_amount: totalAmount,
                status,
                paid_at: paidAt,
                type: InvoiceType.FINAL_SETTLEMENT,
                items: { create: items }
            },
            include: finalInvoiceInclude
        });
    }

    return transaction.invoice.create({
        data: {
            contract_id: termination.contract.id,
            tenant_id: termination.contract.tenant_id,
            invoice_code: invoiceCode,
            due_date: new Date(),
            total_amount: totalAmount,
            status,
            paid_at: paidAt,
            type: InvoiceType.FINAL_SETTLEMENT,
            items: { create: items }
        },
        include: finalInvoiceInclude
    });
};

const saveDepositRefundInvoice = async (
    transaction: Prisma.TransactionClient,
    termination: TerminationWithRelations,
    settlement: { refund_amount: number }
) => {
    const invoiceCode = buildDepositRefundInvoiceCode(termination.id);
    const totalAmount = buildDepositRefundInvoiceTotal(
        settlement.refund_amount
    );
    const existing = await transaction.invoice.findFirst({
        where: { invoice_code: invoiceCode },
        include: finalInvoiceInclude
    });

    if (totalAmount === 0) {
        if (existing && existing.status === InvoiceStatus.UNPAID) {
            await transaction.invoiceItem.deleteMany({
                where: { invoice_id: existing.id }
            });
            await transaction.invoice.delete({ where: { id: existing.id } });
            return null;
        }

        return existing;
    }

    const items: Prisma.InvoiceItemCreateWithoutInvoiceInput[] = [{
        item_name: "Hoàn trả tiền cọc sau thanh lý hợp đồng",
        quantity: 1,
        unit_price: totalAmount,
        amount: totalAmount
    }];

    if (existing) {
        await transaction.invoiceItem.deleteMany({
            where: { invoice_id: existing.id }
        });

        return transaction.invoice.update({
            where: { id: existing.id },
            data: {
                contract_id: termination.contract.id,
                tenant_id: termination.contract.tenant_id,
                due_date: existing.due_date,
                total_amount: totalAmount,
                type: InvoiceType.REFUND,
                items: { create: items }
            },
            include: finalInvoiceInclude
        });
    }

    return transaction.invoice.create({
        data: {
            contract_id: termination.contract.id,
            tenant_id: termination.contract.tenant_id,
            invoice_code: invoiceCode,
            due_date: new Date(),
            total_amount: totalAmount,
            status: InvoiceStatus.UNPAID,
            paid_at: null,
            type: InvoiceType.REFUND,
            items: { create: items }
        },
        include: finalInvoiceInclude
    });
};

export const syncMissingDepositRefundInvoicesForActor = async (
    actor: Actor
) => {
    const terminations = await prisma.contractTermination.findMany({
        where: {
            status: ContractTerminationStatus.COMPLETED,
            ...getTerminationScope(actor)
        },
        include: terminationInclude
    });

    if (terminations.length === 0) return;

    const refundCodes = terminations.map((termination) =>
        buildDepositRefundInvoiceCode(termination.id)
    );
    const existingRefunds = await prisma.invoice.findMany({
        where: {
            invoice_code: { in: refundCodes }
        },
        select: { invoice_code: true }
    });
    const existingCodes = new Set(
        existingRefunds.map((invoice) => invoice.invoice_code)
    );
    const missingTerminations = terminations.filter((termination) =>
        !existingCodes.has(buildDepositRefundInvoiceCode(termination.id))
    );

    if (missingTerminations.length === 0) return;

    await prisma.$transaction(async (transaction) => {
        for (const termination of missingTerminations) {
            const finalInvoice = (
                termination.contract as TerminationWithRelations["contract"] & {
                    invoices?: FinalSettlementInvoice[];
                }
            ).invoices?.[0] ?? null;

            if (!finalInvoice) continue;

            const settlement = buildSettlementSummaryFromFinalInvoice(
                termination,
                finalInvoice
            );

            await saveDepositRefundInvoice(
                transaction,
                termination,
                { refund_amount: settlement.refund_amount }
            );
        }
    });
};

const sumFinalInvoiceItems = (
    invoice: FinalSettlementInvoice | null | undefined,
    match: (itemName: string) => boolean
) => (invoice?.items ?? []).reduce(
    (sum, item) => match(item.item_name)
        ? moneyNumber(sum + toNumber(item.amount))
        : sum,
    0
);

const buildSettlementSummaryFromFinalInvoice = (
    termination: TerminationWithRelations,
    invoice: FinalSettlementInvoice | null | undefined
) => {
    const depositPaid = moneyNumber(termination.contract.deposit_amount);
    const refundRate = toNumber(termination.refund_rate);
    const eligibleDeposit = termination.type === ContractTerminationType.OVERDUE
        ? 0
        : moneyNumber(depositPaid * refundRate / 100);
    const additionalAmountDue = moneyNumber(invoice?.total_amount ?? 0);
    const depositApplied = Math.min(eligibleDeposit, additionalAmountDue);

    return {
        deposit_paid: depositPaid,
        eligible_deposit: eligibleDeposit,
        outstanding_debt: sumFinalInvoiceItems(
            invoice,
            (itemName) => itemName === "Công nợ hóa đơn chưa thanh toán"
        ),
        final_rent: sumFinalInvoiceItems(
            invoice,
            (itemName) => itemName === "Tiền thuê cuối kỳ"
        ),
        final_electricity: sumFinalInvoiceItems(
            invoice,
            (itemName) => itemName === "Tiền điện cuối kỳ"
                || itemName.startsWith("Tiền điện chốt")
        ),
        final_water: sumFinalInvoiceItems(
            invoice,
            (itemName) => itemName === "Tiền nước cuối kỳ"
                || itemName.startsWith("Tiền nước chốt")
        ),
        final_service_fee: sumFinalInvoiceItems(
            invoice,
            (itemName) => itemName === "Phí dịch vụ cuối kỳ"
        ),
        other_charges: sumFinalInvoiceItems(
            invoice,
            (itemName) => itemName === "Khoản phát sinh khác"
        ),
        damage_amount: sumFinalInvoiceItems(
            invoice,
            (itemName) => itemName.startsWith("Bồi thường:")
                || itemName === "Cơ sở vật chất hư hại"
        ),
        deposit_applied: depositApplied,
        refund_amount: termination.type === ContractTerminationType.OVERDUE
            ? 0
            : Math.max(moneyNumber(eligibleDeposit - additionalAmountDue), 0),
        additional_amount_due: additionalAmountDue,
        invoice_total_amount: additionalAmountDue,
        financial_status: getRuntimeFinancialStatus(additionalAmountDue, invoice),
        final_invoice: normalizeFinalInvoice(invoice)
    };
};

export const getContractTerminationsService = async (
    filters: ListContractTerminationsRequest["query"],
    actor: Actor
) => {
    const where: Prisma.ContractTerminationWhereInput = {
        ...getTerminationScope(actor),
        ...(filters.contract_id === undefined
            ? {}
            : { contract_id: filters.contract_id }),
        ...(filters.status === undefined ? {} : { status: filters.status }),
        ...(filters.type === undefined ? {} : { type: filters.type })
    };
    const [terminations, total] = await prisma.$transaction([
        prisma.contractTermination.findMany({
            where,
            skip: (filters.page - 1) * filters.limit,
            take: filters.limit,
            orderBy: { requested_at: "desc" },
            include: terminationInclude
        }),
        prisma.contractTermination.count({ where })
    ]);

    return {
        data: terminations.map(normalizeTermination),
        pagination: {
            page: filters.page,
            limit: filters.limit,
            total,
            totalPages: Math.ceil(total / filters.limit)
        }
    };
};

export const createTenantTerminationService = async (
    input: CreateTenantTerminationRequest["body"],
    actor: Actor,
    now = new Date()
) => {
    const tenantId = requireTenantId(actor);

    try {
        return await runSerializableTransaction(async (transaction) => {
            const contract = await transaction.rentalContract.findFirst({
                where: {
                    id: input.contract_id,
                    tenant_id: tenantId
                },
                include: contractInclude
            });

            if (!contract) {
                throw new AppError(
                    403,
                    "UNAUTHORIZED_CONTRACT_ACCESS",
                    "Bạn không có quyền thanh lý hợp đồng này"
                );
            }

            if (contract.status !== ContractStatus.ACTIVE) {
                throw contractNotActive();
            }

            const requestedEndDate = startOfUtcDay(input.requested_end_date);
            const today = startOfUtcDay(now);

            if (
                requestedEndDate < today
                || requestedEndDate > startOfUtcDay(contract.end_date)
            ) {
                throw new AppError(
                    400,
                    "NOTICE_DATE_INVALID",
                    "Ngày muốn kết thúc không hợp lệ"
                );
            }

            await assertNoOpenTermination(transaction, contract.id);

            const noticeDays = calculateNoticeDays(today, requestedEndDate);
            const policy = calculateNoticePolicy(noticeDays);
            const created = await transaction.contractTermination.create({
                data: {
                    contract_id: contract.id,
                    type: ContractTerminationType.TENANT_REQUEST,
                    status: ContractTerminationStatus.PENDING,
                    requested_end_date: requestedEndDate,
                    reason: input.reason,
                    notice_days: noticeDays,
                    deposit_policy: policy.deposit_policy,
                    refund_rate: policy.refund_rate,
                    requested_by: actor.userId
                },
                include: terminationInclude
            });

            await notifyManagersOfTenantTerminationRequest(transaction, created);

            return normalizeTermination(created);
        }, concurrentModification);
    } catch (error) {
        return mapTerminationWriteError(error);
    }
};

export const approveTerminationService = async (
    id: number,
    input: { effective_end_date?: Date },
    actor: Actor
) => {
    assertManagerOrAdmin(actor);

    return runSerializableTransaction(async (transaction) => {
        const termination = await findTerminationInScope(
            transaction,
            id,
            actor
        );

        if (termination.status === ContractTerminationStatus.APPROVED) {
            await transaction.apartment.updateMany({
                where: {
                    id: termination.contract.apartment_id,
                    status: ApartmentStatus.RENTED
                },
                data: { status: ApartmentStatus.VACATING_SOON }
            });

            return normalizeTermination(termination);
        }

        if (termination.status !== ContractTerminationStatus.PENDING) {
            throw invalidState();
        }

        const effectiveEndDate =
            input.effective_end_date ?? termination.requested_end_date;
        const updated = await transaction.contractTermination.update({
            where: {
                id: termination.id,
                status: ContractTerminationStatus.PENDING
            },
            data: {
                status: ContractTerminationStatus.APPROVED,
                effective_end_date: effectiveEndDate,
                approved_by: actor.userId,
                approved_at: new Date()
            },
            include: terminationInclude
        });

        await transaction.apartment.updateMany({
            where: {
                id: termination.contract.apartment_id,
                status: ApartmentStatus.RENTED
            },
            data: { status: ApartmentStatus.VACATING_SOON }
        });

        await notifyTenantTerminationApproved(transaction, updated);

        return normalizeTermination(updated);
    }, concurrentModification);
};

export const rejectTerminationService = async (
    id: number,
    rejectedReason: string,
    actor: Actor
) => {
    assertManagerOrAdmin(actor);

    return runSerializableTransaction(async (transaction) => {
        const termination = await findTerminationInScope(
            transaction,
            id,
            actor
        );

        if (termination.status === ContractTerminationStatus.REJECTED) {
            return normalizeTermination(termination);
        }

        if (termination.status !== ContractTerminationStatus.PENDING) {
            throw invalidState();
        }

        const updated = await transaction.contractTermination.update({
            where: {
                id: termination.id,
                status: ContractTerminationStatus.PENDING
            },
            data: {
                status: ContractTerminationStatus.REJECTED,
                rejected_reason: rejectedReason
            },
            include: terminationInclude
        });

        await notifyTenantTerminationRejected(transaction, updated, rejectedReason);

        return normalizeTermination(updated);
    }, concurrentModification);
};

export const cancelTerminationService = async (
    id: number,
    actor: Actor
) => runSerializableTransaction(async (transaction) => {
    const termination = await findTerminationInScope(transaction, id, actor);
    const tenantCancelsPending = actor.role === Role.TENANT
        && termination.status === ContractTerminationStatus.PENDING;
    const managerCancelsBeforeComplete = (
        actor.role === Role.ADMIN
        || actor.role === Role.MANAGER
    )
        && openStatuses.includes(
            termination.status as typeof openStatuses[number]
        )
        && termination.contract.status === ContractStatus.ACTIVE;

    if (!tenantCancelsPending && !managerCancelsBeforeComplete) {
        throw invalidState("Không thể hủy yêu cầu ở trạng thái hiện tại");
    }

    const updated = await transaction.contractTermination.update({
        where: { id: termination.id },
        data: { status: ContractTerminationStatus.CANCELLED },
        include: terminationInclude
    });

    if (managerCancelsBeforeComplete) {
        await transaction.apartment.updateMany({
            where: {
                id: termination.contract.apartment_id,
                status: ApartmentStatus.VACATING_SOON
            },
            data: { status: ApartmentStatus.RENTED }
        });

        await notifyTenantTerminationCancelled(transaction, updated);
    }

    return normalizeTermination(updated);
}, concurrentModification);

export const getOverdueCandidatesService = async (
    actor: Actor,
    now = new Date()
) => {
    assertManagerOrAdmin(actor);

    const contracts = await prisma.rentalContract.findMany({
        where: {
            status: ContractStatus.ACTIVE,
            ...getManagedContractScope(actor),
            terminations: {
                none: { status: { in: [...openStatuses] } }
            }
        },
        include: contractInclude
    });

    const candidates = await Promise.all(
        contracts.map(async (contract) => {
            const overdue = await getOverdueDebtInfo(
                prisma,
                contract.id,
                now
            );

            return {
                contract,
                overdue_amount: overdue.amount,
                overdue_invoice_count: overdue.invoice_count
            };
        })
    );

    return candidates.filter((candidate) => candidate.overdue_amount > 0);
};

export const createOverdueTerminationService = async (
    input: CreateOverdueTerminationRequest["body"],
    actor: Actor,
    now = new Date()
) => {
    assertManagerOrAdmin(actor);

    try {
        return await runSerializableTransaction(async (transaction) => {
            const contract = await transaction.rentalContract.findFirst({
                where: {
                    id: input.contract_id,
                    ...getManagedContractScope(actor)
                },
                include: contractInclude
            });

            if (!contract) {
                throw new AppError(404, "NOT_FOUND", "Hợp đồng không tồn tại");
            }

            if (contract.status !== ContractStatus.ACTIVE) {
                throw contractNotActive();
            }

            await assertNoOpenTermination(transaction, contract.id);

            const overdue = await getOverdueDebtInfo(
                transaction,
                contract.id,
                now
            );
            if (overdue.amount <= 0) {
                throw new AppError(
                    409,
                    "CONTRACT_NOT_OVERDUE",
                    "Hợp đồng chưa có hóa đơn quá hạn trên 7 ngày để quản lý chủ động thanh lý"
                );
            }

            const today = startOfUtcDay(now);
            const created = await transaction.contractTermination.create({
                data: {
                    contract_id: contract.id,
                    type: ContractTerminationType.OVERDUE,
                    status: ContractTerminationStatus.APPROVED,
                    requested_end_date: today,
                    effective_end_date: today,
                    reason: input.reason,
                    notice_days: 0,
                    deposit_policy: DepositPolicy.FORFEITED,
                    refund_rate: 0,
                    requested_by: actor.userId,
                    approved_by: actor.userId,
                    approved_at: new Date()
                },
                include: terminationInclude
            });

            await transaction.apartment.updateMany({
                where: {
                    id: contract.apartment_id,
                    status: ApartmentStatus.RENTED
                },
                data: { status: ApartmentStatus.VACATING_SOON }
            });

            await notifyTenantProactiveTermination(transaction, created);

            return normalizeTermination(created);
        }, concurrentModification);
    } catch (error) {
        return mapTerminationWriteError(error);
    }
};

export const startInspectionService = async (
    id: number,
    actor: Actor
) => {
    assertManagerOrAdmin(actor);

    return runSerializableTransaction(async (transaction) => {
        const termination = await findTerminationInScope(
            transaction,
            id,
            actor
        );

        if (termination.status === ContractTerminationStatus.INSPECTION) {
            return normalizeTermination(termination);
        }

        if (termination.status !== ContractTerminationStatus.APPROVED) {
            throw invalidState();
        }

        const updated = await transaction.contractTermination.update({
            where: {
                id: termination.id,
                status: ContractTerminationStatus.APPROVED
            },
            data: { status: ContractTerminationStatus.INSPECTION },
            include: terminationInclude
        });

        return normalizeTermination(updated);
    }, concurrentModification);
};

export const updateInspectionService = async (
    id: number,
    input: UpdateInspectionRequest["body"],
    actor: Actor
) => {
    assertManagerOrAdmin(actor);

    return runSerializableTransaction(async (transaction) => {
        const termination = await findTerminationInScope(
            transaction,
            id,
            actor
        );

        if (
            termination.status !== ContractTerminationStatus.APPROVED
            && termination.status !== ContractTerminationStatus.INSPECTION
            && termination.status !== ContractTerminationStatus.SETTLING
        ) {
            throw invalidState();
        }

        const updated = await transaction.contractTermination.update({
            where: { id: termination.id },
            data: {
                status: ContractTerminationStatus.SETTLING,
                inspection_note: input.inspection_note,
                final_electricity_old: input.final_electricity_old,
                final_electricity_new: input.final_electricity_new,
                final_water_old: input.final_water_old,
                final_water_new: input.final_water_new,
                requires_maintenance: input.requires_maintenance,
                ...buildDepositPolicyUpdate(input.deposit_policy, termination.type)
            },
            include: terminationInclude
        });

        return normalizeTermination(updated);
    }, concurrentModification);
};

export const previewSettlementService = async (
    id: number,
    input: PreviewSettlementRequest["body"],
    actor: Actor
) => {
    assertManagerOrAdmin(actor);

    const termination = await findTerminationInScope(prisma, id, actor);

    if (
        !openStatuses.includes(
            termination.status as typeof openStatuses[number]
        )
    ) {
        throw invalidState();
    }

    return calculateSettlementForTermination(prisma, termination, input);
};

export const completeHandoverService = async (
    id: number,
    input: CompleteHandoverRequest["body"],
    actor: Actor
) => {
    assertManagerOrAdmin(actor);

    return runSerializableTransaction(async (transaction) => {
        const termination = await findTerminationInScope(
            transaction,
            id,
            actor
        );

        if (termination.status === ContractTerminationStatus.COMPLETED) {
            const finalInvoice = (
                termination.contract as TerminationWithRelations["contract"] & {
                    invoices?: FinalSettlementInvoice[];
                }
            ).invoices?.[0] ?? null;

            const refundInvoice = await transaction.invoice.findFirst({
                where: {
                    invoice_code: buildDepositRefundInvoiceCode(termination.id)
                },
                include: finalInvoiceInclude
            });
            const settlement = buildSettlementSummaryFromFinalInvoice(
                termination,
                finalInvoice
            );

            return {
                termination: {
                    ...normalizeTermination(termination),
                    refund_invoice: normalizeFinalInvoice(refundInvoice)
                },
                settlement: {
                    ...settlement,
                    refund_invoice: normalizeFinalInvoice(refundInvoice)
                }
            };
        }

        if (
            !handoverCompletionStatuses.includes(
                termination.status as typeof handoverCompletionStatuses[number]
            )
        ) {
            throw invalidState("Chỉ có thể hoàn tất sau khi yêu cầu đã được duyệt");
        }

        const settlementData = await calculateSettlementForTermination(
            transaction,
            termination,
            input
        );
        const finalInvoice = await saveFinalSettlementInvoice(
            transaction,
            termination,
            settlementData,
            input
        );
        const refundInvoice = await saveDepositRefundInvoice(
            transaction,
            termination,
            settlementData
        );

        const ended = await transaction.rentalContract.updateMany({
            where: {
                id: termination.contract.id,
                status: ContractStatus.ACTIVE
            },
            data: {
                status: ContractStatus.ENDED,
                end_date:
                    termination.effective_end_date
                    ?? termination.requested_end_date
            }
        });

        if (ended.count === 0) {
            throw contractNotActive();
        }

        await transaction.apartment.updateMany({
            where: {
                id: termination.contract.apartment_id,
                status: ApartmentStatus.VACATING_SOON
            },
            data: {
                status: input.requires_maintenance
                    ? ApartmentStatus.MAINTENANCE
                    : ApartmentStatus.AVAILABLE
            }
        });

        const completedAt = new Date();
        const completedTerminationData = {
            status: ContractTerminationStatus.COMPLETED,
            completed_at: completedAt,
            completed_by: actor.userId,
            inspection_note: input.inspection_note,
            final_electricity_old: input.final_electricity_old,
            final_electricity_new: input.final_electricity_new,
            final_water_old: input.final_water_old,
            final_water_new: input.final_water_new,
            requires_maintenance: input.requires_maintenance ?? false,
            ...buildDepositPolicyUpdate(input.deposit_policy, termination.type)
        };

        await transaction.contractTermination.updateMany({
            where: {
                id: termination.id,
                status: { in: [...handoverCompletionStatuses] }
            },
            data: completedTerminationData
        });

        await notifyTenantTerminationCompleted(
            transaction,
            termination,
            settlementData,
            finalInvoice
        );

        return {
            termination: {
                ...normalizeTermination(termination),
                ...completedTerminationData,
                final_invoice: normalizeFinalInvoice(finalInvoice),
                refund_invoice: normalizeFinalInvoice(refundInvoice)
            },
            settlement: {
                ...settlementData,
                financial_status: getRuntimeFinancialStatus(
                    settlementData.additional_amount_due,
                    finalInvoice
                ),
                final_invoice: normalizeFinalInvoice(finalInvoice),
                refund_invoice: normalizeFinalInvoice(refundInvoice)
            }
        };
    }, concurrentModification);
};