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
    SettlementFinancialStatus
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
    calculateWaterAmount
} from "../utils/invoice-billing.js";
import { getManagerApartmentScope } from "../utils/manager-scope.js";
import { toMoneyCents } from "../utils/money.js";
import { runSerializableTransaction } from "../utils/prisma-transaction.js";
import {
    calculateNoticeDays,
    calculateNoticePolicy,
    calculateSettlement
} from "../utils/contract-termination.rules.js";

const openStatuses = [
    ContractTerminationStatus.PENDING,
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

const terminationInclude = {
    contract: {
        include: contractInclude
    },
    damages: {
        orderBy: { id: "asc" }
    },
    settlement: {
        include: {
            final_invoice: true
        }
    }
} satisfies Prisma.ContractTerminationInclude;

type TerminationWithRelations = Prisma.ContractTerminationGetPayload<{
    include: typeof terminationInclude;
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

const normalizeSettlement = (
    settlement: TerminationWithRelations["settlement"] | undefined
) => settlement === null || settlement === undefined ? null : {
    ...settlement,
    deposit_paid: toNumber(settlement.deposit_paid),
    eligible_deposit: toNumber(settlement.eligible_deposit),
    outstanding_debt: toNumber(settlement.outstanding_debt),
    final_rent: toNumber(settlement.final_rent),
    final_electricity: toNumber(settlement.final_electricity),
    final_water: toNumber(settlement.final_water),
    final_service_fee: toNumber(settlement.final_service_fee),
    other_charges: toNumber(settlement.other_charges),
    damage_amount: toNumber(settlement.damage_amount),
    deposit_applied: toNumber(settlement.deposit_applied),
    refund_amount: toNumber(settlement.refund_amount),
    additional_amount_due: toNumber(settlement.additional_amount_due),
    final_invoice: settlement.final_invoice === null
        ? null
        : {
            ...settlement.final_invoice,
            total_amount: toNumber(settlement.final_invoice.total_amount)
        }
};

const normalizeTermination = (termination: TerminationWithRelations) => ({
    ...termination,
    refund_rate: toNumber(termination.refund_rate),
    contract: {
        ...termination.contract,
        deposit_amount: toNumber(termination.contract.deposit_amount),
        monthly_rent: toNumber(termination.contract.monthly_rent),
        apartment: {
            ...termination.contract.apartment,
            area: toNumber(termination.contract.apartment.area),
            rental_price: toNumber(termination.contract.apartment.rental_price)
        }
    },
    damages: (termination.damages ?? []).map((damage) => ({
        ...damage,
        amount: toNumber(damage.amount)
    })),
    settlement: normalizeSettlement(termination.settlement)
});

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
        type: { not: InvoiceType.FINAL_SETTLEMENT }
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

const getDamageAmount = (
    damages: Array<{ amount: Prisma.Decimal | number }>
) => damages.reduce(
    (sum, damage) => moneyNumber(sum + toNumber(damage.amount)),
    0
);

const getOccupantCount = (termination: TerminationWithRelations) =>
    1 + (termination.contract.tenant._count?.occupants ?? 0);
const getDepositPolicyValues = (
    termination: Pick<TerminationWithRelations, "deposit_policy" | "refund_rate" | "type">,
    depositPolicy: DepositPolicy | undefined
) => {
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
    depositPolicy: DepositPolicy | undefined
) => {
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
    const damageAmount = input.damage_items === undefined
        ? getDamageAmount(termination.damages)
        : input.damage_items.reduce(
            (sum, damage) => moneyNumber(sum + damage.amount),
            0
        );
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

const replaceDamageItems = async (
    transaction: Prisma.TransactionClient,
    terminationId: number,
    items: UpdateInspectionRequest["body"]["damage_items"] | undefined
) => {
    if (items === undefined) {
        return;
    }

    await transaction.contractTerminationDamage.deleteMany({
        where: { termination_id: terminationId }
    });

    if (items.length > 0) {
        await transaction.contractTerminationDamage.createMany({
            data: items.map((item) => ({
                termination_id: terminationId,
                description: item.description,
                amount: item.amount,
                note: item.note
            }))
        });
    }
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
    }

    return normalizeTermination(updated);
}, concurrentModification);

export const getOverdueCandidatesService = async (
    actor: Actor
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

    return contracts.map((contract) => ({
        contract,
        overdue_amount: 0
    }));
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

        await replaceDamageItems(
            transaction,
            termination.id,
            input.damage_items
        );

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
                ...buildDepositPolicyUpdate(input.deposit_policy)
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
        let termination = await findTerminationInScope(
            transaction,
            id,
            actor
        );

        if (
            termination.status === ContractTerminationStatus.COMPLETED
            && termination.settlement !== null
        ) {
            return {
                termination: normalizeTermination(termination),
                settlement: normalizeSettlement(termination.settlement)
            };
        }

        if (termination.status !== ContractTerminationStatus.SETTLING) {
            throw invalidState("Chỉ có thể hoàn tất sau bước quyết toán");
        }

        if (input.damage_items !== undefined) {
            await replaceDamageItems(
                transaction,
                termination.id,
                input.damage_items
            );
            termination = await findTerminationInScope(
                transaction,
                id,
                actor
            );
        }

        const settlementData = await calculateSettlementForTermination(
            transaction,
            termination,
            input
        );
        const hasAdditionalDue = settlementData.additional_amount_due > 0;
        const finalInvoice = hasAdditionalDue
            ? await transaction.invoice.create({
                data: {
                    contract_id: termination.contract.id,
                    tenant_id: termination.contract.tenant_id,
                    invoice_code: buildFinalSettlementInvoiceCode(
                        termination.id
                    ),
                    due_date: new Date(),
                    total_amount: settlementData.additional_amount_due,
                    status: InvoiceStatus.UNPAID,
                    type: InvoiceType.FINAL_SETTLEMENT,
                    items: {
                        create: [
                            {
                                item_name: "Khoản phải thu sau quyết toán thanh lý",
                                quantity: 1,
                                unit_price:
                                    settlementData.additional_amount_due,
                                amount:
                                    settlementData.additional_amount_due
                            }
                        ]
                    }
                }
            })
            : null;
        const settlement = await transaction.contractSettlement.upsert({
            where: { termination_id: termination.id },
            create: {
                termination_id: termination.id,
                final_invoice_id: finalInvoice?.id,
                ...settlementData,
                financial_status: hasAdditionalDue
                    ? SettlementFinancialStatus.AWAITING_PAYMENT
                    : SettlementFinancialStatus.SETTLED,
                settled_at: hasAdditionalDue ? null : new Date()
            },
            update: {
                final_invoice_id: finalInvoice?.id,
                ...settlementData,
                financial_status: hasAdditionalDue
                    ? SettlementFinancialStatus.AWAITING_PAYMENT
                    : SettlementFinancialStatus.SETTLED,
                settled_at: hasAdditionalDue ? null : new Date()
            }
        });

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

        await transaction.contractTermination.updateMany({
            where: {
                id: termination.id,
                status: ContractTerminationStatus.SETTLING
            },
            data: {
                status: ContractTerminationStatus.COMPLETED,
                completed_at: new Date(),
                completed_by: actor.userId,
                requires_maintenance: input.requires_maintenance ?? false,
                ...buildDepositPolicyUpdate(input.deposit_policy)
            }
        });

        return {
            termination: {
                ...normalizeTermination(termination),
                status: ContractTerminationStatus.COMPLETED,
                completed_by: actor.userId
            },
            settlement: {
                ...settlement,
                deposit_paid: toNumber(settlement.deposit_paid),
                eligible_deposit: toNumber(settlement.eligible_deposit),
                outstanding_debt: toNumber(settlement.outstanding_debt),
                final_rent: toNumber(settlement.final_rent),
                final_electricity: toNumber(settlement.final_electricity),
                final_water: toNumber(settlement.final_water),
                final_service_fee: toNumber(settlement.final_service_fee),
                other_charges: toNumber(settlement.other_charges),
                damage_amount: toNumber(settlement.damage_amount),
                deposit_applied: toNumber(settlement.deposit_applied),
                refund_amount: toNumber(settlement.refund_amount),
                additional_amount_due:
                    toNumber(settlement.additional_amount_due)
            }
        };
    }, concurrentModification);
};

