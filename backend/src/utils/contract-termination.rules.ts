import { Prisma } from "@prisma/client";

export const FULL_DEPOSIT_REFUND_NOTICE_DAYS = 60;
export const OVERDUE_TERMINATION_GRACE_DAYS = 7;

type TerminationType = "TENANT_REQUEST" | "MANAGER_REQUEST" | "OVERDUE";

type SettlementInput = {
    terminationType: TerminationType;
    depositPaid: number | Prisma.Decimal;
    refundRate: number | Prisma.Decimal;
    outstandingDebt: number | Prisma.Decimal;
    finalRent: number | Prisma.Decimal;
    finalElectricity: number | Prisma.Decimal;
    finalWater: number | Prisma.Decimal;
    finalServiceFee: number | Prisma.Decimal;
    otherCharges: number | Prisma.Decimal;
    damageAmount: number | Prisma.Decimal;
};

const ZERO = new Prisma.Decimal(0);

const money = (value: number | Prisma.Decimal) =>
    new Prisma.Decimal(value).toDecimalPlaces(
        2,
        Prisma.Decimal.ROUND_HALF_UP
    );

const toNumber = (value: Prisma.Decimal) => money(value).toNumber();

export const shouldIncludeInvoiceInFinalSettlementDebt = (
    invoiceType: string
) => invoiceType !== "FINAL_SETTLEMENT" && invoiceType !== "REFUND";

export const buildDepositRefundInvoiceTotal = (
    refundAmount: number | Prisma.Decimal
) => {
    const amount = Prisma.Decimal.max(money(refundAmount), ZERO);
    return amount.equals(0) ? 0 : toNumber(amount.negated());
};

export const calculateNoticeDays = (from: Date, to: Date) => {
    const start = Date.UTC(
        from.getUTCFullYear(),
        from.getUTCMonth(),
        from.getUTCDate()
    );
    const end = Date.UTC(
        to.getUTCFullYear(),
        to.getUTCMonth(),
        to.getUTCDate()
    );

    return Math.floor((end - start) / 86_400_000);
};

export const calculateNoticePolicy = (noticeDays: number) => (
    noticeDays >= FULL_DEPOSIT_REFUND_NOTICE_DAYS
        ? {
            deposit_policy: "REFUNDABLE" as const,
            refund_rate: 100
        }
        : {
            deposit_policy: "FORFEITED" as const,
            refund_rate: 0
        }
);

export const isInvoiceOverdueForTermination = (
    dueDate: Date,
    now = new Date()
) => now.getTime() > dueDate.getTime()
    + OVERDUE_TERMINATION_GRACE_DAYS * 86_400_000;

export const calculateSettlement = (input: SettlementInput) => {
    const depositPaid = money(input.depositPaid);
    const refundRate = money(input.refundRate);
    const eligibleDeposit = input.terminationType === "OVERDUE"
        ? ZERO
        : money(depositPaid.mul(refundRate).div(100));
    const totalObligation = money(input.outstandingDebt)
        .plus(money(input.finalRent))
        .plus(money(input.finalElectricity))
        .plus(money(input.finalWater))
        .plus(money(input.finalServiceFee))
        .plus(money(input.otherCharges))
        .plus(money(input.damageAmount));
    const depositApplied = Prisma.Decimal.min(
        eligibleDeposit,
        totalObligation
    );
    const refundAmount = input.terminationType === "OVERDUE"
        ? ZERO
        : Prisma.Decimal.max(eligibleDeposit.minus(totalObligation), ZERO);
    const additionalAmountDue = totalObligation;

    return {
        depositPaid: toNumber(depositPaid),
        eligibleDeposit: toNumber(eligibleDeposit),
        totalObligation: toNumber(totalObligation),
        depositApplied: toNumber(depositApplied),
        refundAmount: toNumber(refundAmount),
        additionalAmountDue: toNumber(additionalAmountDue),
        invoiceTotalAmount: toNumber(totalObligation),
        financialStatus: additionalAmountDue.greaterThan(0)
            ? "AWAITING_PAYMENT" as const
            : "SETTLED" as const
    };
};