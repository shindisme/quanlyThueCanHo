import {
    InvoiceStatus,
    PaymentStatus,
    Prisma
} from "@prisma/client";
import { prisma } from "../src/config/database.js";
import {
    buildRecurringMonthlyInvoiceItems,
    sumBillingItems,
    type BillingInvoiceItem
} from "../src/utils/invoice-billing.js";

const isExecute = process.argv.includes("--execute");

const invoiceInclude = {
    items: true,
    payments: true,
    contract: {
        include: {
            apartment: {
                select: {
                    id: true,
                    area: true,
                    room_number: true
                }
            },
            tenant: {
                select: {
                    id: true,
                    full_name: true
                }
            }
        }
    }
} satisfies Prisma.InvoiceInclude;

type InvoiceForRepair = Prisma.InvoiceGetPayload<{
    include: typeof invoiceInclude;
}>;

type InvoicePeriod = {
    month: number;
    year: number;
};

type RepairPlan = {
    invoice: InvoiceForRepair;
    period: InvoicePeriod;
    previousContractId: number;
    items: BillingInvoiceItem[];
    oldTotal: number;
    newTotal: number;
    successPaymentId?: number;
};

type Conflict = {
    invoice_code: string;
    reason: string;
};

const padMonth = (month: number) => month.toString().padStart(2, "0");

const parseInvoicePeriod = (invoiceCode: string): InvoicePeriod | null => {
    const match = invoiceCode.match(/-(\d{4})(0[1-9]|1[0-2])$/);
    if (!match) {
        return null;
    }

    return {
        year: Number(match[1]),
        month: Number(match[2])
    };
};

const normalizeText = (value: string) =>
    value
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase();

const hasFirstRentalItems = (invoice: InvoiceForRepair) =>
    invoice.items.some((item) => {
        const itemName = normalizeText(item.item_name);

        return itemName.includes("tien coc")
            || itemName.includes("thang dau tien");
    });

const isContractStartPeriod = (
    startDate: Date,
    period: InvoicePeriod
) => startDate.getUTCFullYear() === period.year
    && startDate.getUTCMonth() + 1 === period.month;

const nonNegativeDecimalDifference = (
    newer: Prisma.Decimal,
    older: Prisma.Decimal
) => {
    const difference = new Prisma.Decimal(newer).minus(older);

    return difference.isNegative()
        ? new Prisma.Decimal(0)
        : difference;
};

const buildRecurringItems = async (
    invoice: InvoiceForRepair,
    period: InvoicePeriod
) => {
    const reading = await prisma.utilityReading.findUnique({
        where: {
            apartment_id_month_year: {
                apartment_id: invoice.contract.apartment_id,
                month: period.month,
                year: period.year
            }
        }
    });

    if (!reading) {
        return null;
    }

    return buildRecurringMonthlyInvoiceItems({
        monthlyRent: invoice.contract.monthly_rent,
        area: invoice.contract.apartment.area,
        electricConsumption: nonNegativeDecimalDifference(
            reading.electric_new,
            reading.electric_old
        ),
        waterConsumption: nonNegativeDecimalDifference(
            reading.water_new,
            reading.water_old
        ),
        periodLabel: `${padMonth(period.month)}/${period.year}`
    });
};

const buildRepairPlan = async () => {
    const invoices = await prisma.invoice.findMany({
        where: {
            invoice_code: {
                startsWith: "INV-"
            }
        },
        include: invoiceInclude,
        orderBy: { id: "asc" }
    });
    const plans: RepairPlan[] = [];
    const conflicts: Conflict[] = [];

    for (const invoice of invoices) {
        const period = parseInvoicePeriod(invoice.invoice_code);
        if (!period) {
            continue;
        }

        if (
            !isContractStartPeriod(invoice.contract.start_date, period)
            || !hasFirstRentalItems(invoice)
        ) {
            continue;
        }

        const previousContract = await prisma.rentalContract.findFirst({
            where: {
                id: { not: invoice.contract_id },
                tenant_id: invoice.contract.tenant_id,
                apartment_id: invoice.contract.apartment_id,
                end_date: { lte: invoice.contract.start_date }
            },
            select: { id: true },
            orderBy: { id: "desc" }
        });

        if (!previousContract) {
            continue;
        }

        const successPayments = invoice.payments.filter((payment) =>
            payment.status === PaymentStatus.SUCCESS
        );
        if (
            invoice.status === InvoiceStatus.PAID
            && successPayments.length !== 1
        ) {
            conflicts.push({
                invoice_code: invoice.invoice_code,
                reason: `Hóa đơn PAID nhưng có ${successPayments.length} payment SUCCESS.`
            });
            continue;
        }

        const items = await buildRecurringItems(invoice, period);
        if (!items) {
            conflicts.push({
                invoice_code: invoice.invoice_code,
                reason: `Thiếu utility reading ${padMonth(period.month)}/${period.year}.`
            });
            continue;
        }

        plans.push({
            invoice,
            period,
            previousContractId: previousContract.id,
            items,
            oldTotal: Number(invoice.total_amount),
            newTotal: sumBillingItems(items),
            successPaymentId: successPayments[0]?.id
        });
    }

    return { plans, conflicts };
};

const printPlan = (plans: RepairPlan[], conflicts: Conflict[]) => {
    const delta = plans.reduce(
        (sum, plan) => sum + (plan.newTotal - plan.oldTotal),
        0
    );

    console.log("Repair hóa đơn gia hạn bị tính nhầm tháng đầu tiên");
    console.log(`Mode: ${isExecute ? "execute" : "dry-run"}`);
    console.log(`affected=${plans.length}`);
    console.log(`conflicts=${conflicts.length}`);
    console.log(`total_delta=${delta}`);

    if (plans.length > 0) {
        console.log("Sample:");
        for (const plan of plans.slice(0, 10)) {
            console.log(
                `- ${plan.invoice.invoice_code}: ${plan.oldTotal} -> ${plan.newTotal}, `
                + `contract=${plan.invoice.contract_id}, prev=${plan.previousContractId}, `
                + `apt=${plan.invoice.contract.apartment.room_number}, `
                + `period=${padMonth(plan.period.month)}/${plan.period.year}`
            );
        }
    }

    if (conflicts.length > 0) {
        console.log("Conflicts:");
        for (const conflict of conflicts.slice(0, 20)) {
            console.log(`- ${conflict.invoice_code}: ${conflict.reason}`);
        }
        if (conflicts.length > 20) {
            console.log(`... còn ${conflicts.length - 20} conflicts`);
        }
    }
};

const executeRepair = async (plans: RepairPlan[]) => {
    for (const plan of plans) {
        await prisma.$transaction(async (tx) => {
            await tx.invoiceItem.deleteMany({
                where: { invoice_id: plan.invoice.id }
            });

            await tx.invoice.update({
                where: { id: plan.invoice.id },
                data: {
                    total_amount: plan.newTotal,
                    items: {
                        create: plan.items
                    }
                }
            });

            if (plan.successPaymentId !== undefined) {
                await tx.payment.update({
                    where: { id: plan.successPaymentId },
                    data: { amount: plan.newTotal }
                });
            }
        });
    }
};

const main = async () => {
    const { plans, conflicts } = await buildRepairPlan();
    printPlan(plans, conflicts);

    if (conflicts.length > 0) {
        process.exitCode = 1;
        return;
    }

    if (!isExecute) {
        return;
    }

    await executeRepair(plans);
    const after = await buildRepairPlan();

    console.log("Validation sau execute:");
    console.log(`remaining_affected=${after.plans.length}`);
    console.log(`remaining_conflicts=${after.conflicts.length}`);

    if (after.plans.length > 0 || after.conflicts.length > 0) {
        process.exitCode = 1;
    }
};

main()
    .catch((error: unknown) => {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
