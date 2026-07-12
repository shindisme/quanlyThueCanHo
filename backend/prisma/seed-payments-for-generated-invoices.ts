import {
    InvoiceStatus,
    PaymentStatus,
    Prisma,
    PrismaClient
} from "@prisma/client";

const prisma = new PrismaClient();

const TARGET_YEAR = 2026;
const TARGET_MONTHS = [1, 2, 3, 4, 5, 6] as const;
const PAYMENT_METHOD = "BANK_TRANSFER";
const BATCH_SIZE = 25;

type TargetMonth = typeof TARGET_MONTHS[number];

type TargetInvoice = Prisma.InvoiceGetPayload<{
    include: {
        payments: true;
        tenant: {
            select: {
                id: true;
                full_name: true;
            };
        };
    };
}>;

type PaymentPlanItem = {
    invoice: TargetInvoice;
    month: TargetMonth;
    totalAmount: Prisma.Decimal;
    successfulPaidAmount: Prisma.Decimal;
    remainingAmount: Prisma.Decimal;
    transactionCode: string;
    paidAt: Date;
    createPayment: boolean;
    updateInvoiceStatus: boolean;
    skipReason?: string;
};

const padMonth = (month: number) => month.toString().padStart(2, "0");

const targetSuffixes = () =>
    TARGET_MONTHS.map((month) => `${TARGET_YEAR}${padMonth(month)}`);

const chunkArray = <T>(items: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let index = 0; index < items.length; index += size) {
        chunks.push(items.slice(index, index + size));
    }
    return chunks;
};

const getInvoiceMonth = (invoiceCode: string): TargetMonth | null => {
    const match = invoiceCode.match(/^INV-\d+-(\d{4})(\d{2})$/);
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    if (year !== TARGET_YEAR || !TARGET_MONTHS.includes(month as TargetMonth)) {
        return null;
    }

    return month as TargetMonth;
};

const getSuccessfulPaidAmount = (invoice: TargetInvoice) =>
    invoice.payments
        .filter((payment) => payment.status === PaymentStatus.SUCCESS)
        .reduce(
            (sum, payment) => sum.plus(payment.amount),
            new Prisma.Decimal(0)
        );

const buildTransactionCode = (invoiceCode: string) =>
    `SEED-PAY-${invoiceCode}`;

const buildPaidAt = (invoice: TargetInvoice) => {
    const base = invoice.due_date;
    const offsetDays = invoice.id % 4;
    return new Date(Date.UTC(
        base.getUTCFullYear(),
        base.getUTCMonth(),
        Math.max(1, base.getUTCDate() - offsetDays),
        2 + (invoice.id % 6),
        (invoice.id * 17) % 60,
        0,
        0
    ));
};

async function getTargetInvoices() {
    const invoices = await prisma.invoice.findMany({
        where: {
            invoice_code: { startsWith: "INV-" },
            OR: targetSuffixes().map((suffix) => ({
                invoice_code: { endsWith: suffix }
            }))
        },
        include: {
            payments: true,
            tenant: {
                select: {
                    id: true,
                    full_name: true
                }
            }
        },
        orderBy: [
            { invoice_code: "asc" },
            { id: "asc" }
        ]
    });

    return invoices.filter((invoice) => getInvoiceMonth(invoice.invoice_code) !== null);
}

async function buildPaymentPlan() {
    const invoices = await getTargetInvoices();
    const transactionCodes = invoices.map((invoice) =>
        buildTransactionCode(invoice.invoice_code)
    );
    const existingSeedPayments = transactionCodes.length === 0
        ? []
        : await prisma.payment.findMany({
            where: {
                transaction_code: {
                    in: transactionCodes
                }
            },
            select: {
                id: true,
                invoice_id: true,
                transaction_code: true,
                amount: true,
                status: true
            }
        });
    const seedPaymentByCode = new Map(
        existingSeedPayments.map((payment) => [
            payment.transaction_code,
            payment
        ])
    );
    const conflicts: string[] = [];

    const plan = invoices.map((invoice): PaymentPlanItem => {
        const month = getInvoiceMonth(invoice.invoice_code);
        if (month === null) {
            throw new Error(`Unexpected invoice_code: ${invoice.invoice_code}`);
        }

        const totalAmount = new Prisma.Decimal(invoice.total_amount);
        const successfulPaidAmount = getSuccessfulPaidAmount(invoice);
        const remainingAmount = Prisma.Decimal.max(
            totalAmount.minus(successfulPaidAmount),
            new Prisma.Decimal(0)
        );
        const transactionCode = buildTransactionCode(invoice.invoice_code);
        const existingSeedPayment = seedPaymentByCode.get(transactionCode);

        if (existingSeedPayment && existingSeedPayment.invoice_id !== invoice.id) {
            conflicts.push(
                `${transactionCode} belongs to invoice_id=${existingSeedPayment.invoice_id}, expected ${invoice.id}`
            );
        }

        const createPayment = remainingAmount.gt(0)
            && !existingSeedPayment;
        const updateInvoiceStatus =
            invoice.status !== InvoiceStatus.PAID || invoice.paid_at === null;
        const skipReason = !createPayment && !updateInvoiceStatus
            ? "already paid with history"
            : undefined;

        return {
            invoice,
            month,
            totalAmount,
            successfulPaidAmount,
            remainingAmount,
            transactionCode,
            paidAt: buildPaidAt(invoice),
            createPayment,
            updateInvoiceStatus,
            skipReason
        };
    });

    return { plan, conflicts };
}

function printPlan(items: PaymentPlanItem[], conflicts: string[]) {
    const createItems = items.filter((item) => item.createPayment);
    const updateItems = items.filter((item) => item.updateInvoiceStatus);
    const skippedItems = items.filter((item) => item.skipReason);
    const totalAmount = items.reduce(
        (sum, item) => sum.plus(item.totalAmount),
        new Prisma.Decimal(0)
    );
    const createAmount = createItems.reduce(
        (sum, item) => sum.plus(item.remainingAmount),
        new Prisma.Decimal(0)
    );

    console.log("Seed payments for generated invoices 01/2026 -> 06/2026");
    console.log(`- target_invoices: ${items.length}`);
    console.log(`- payments_to_create: ${createItems.length}`);
    console.log(`- invoices_to_mark_paid: ${updateItems.length}`);
    console.log(`- already_paid_skip: ${skippedItems.length}`);
    console.log(`- conflict_count: ${conflicts.length}`);
    console.log(`- target_total_amount: ${totalAmount.toFixed(0)}`);
    console.log(`- payment_amount_to_create: ${createAmount.toFixed(0)}`);

    for (const month of TARGET_MONTHS) {
        const monthItems = items.filter((item) => item.month === month);
        const monthCreateItems = monthItems.filter((item) => item.createPayment);
        const monthAmount = monthCreateItems.reduce(
            (sum, item) => sum.plus(item.remainingAmount),
            new Prisma.Decimal(0)
        );
        console.log(
            `- ${padMonth(month)}/${TARGET_YEAR}: invoices=${monthItems.length}, `
            + `create_payments=${monthCreateItems.length}, amount=${monthAmount.toFixed(0)}`
        );
    }

    if (conflicts.length > 0) {
        console.log("Conflicts:");
        for (const conflict of conflicts.slice(0, 20)) {
            console.log(`- ${conflict}`);
        }
    }

    console.log("Samples:");
    for (const item of items.slice(0, 10)) {
        console.log(
            `- invoice_id=${item.invoice.id}, code=${item.invoice.invoice_code}, `
            + `tenant=${item.invoice.tenant.full_name}, total=${item.totalAmount.toFixed(0)}, `
            + `remaining=${item.remainingAmount.toFixed(0)}, `
            + `create_payment=${item.createPayment}, paid_at=${item.paidAt.toISOString()}`
        );
    }
}

async function runDryRun() {
    const { plan, conflicts } = await buildPaymentPlan();
    printPlan(plan, conflicts);
    if (conflicts.length > 0) {
        process.exitCode = 1;
    }
}

async function runExecute() {
    const { plan, conflicts } = await buildPaymentPlan();
    printPlan(plan, conflicts);

    if (conflicts.length > 0) {
        throw new Error("Stop execute because payment transaction code conflicts exist.");
    }

    const itemsToProcess = plan.filter((item) =>
        item.createPayment || item.updateInvoiceStatus
    );
    let createdPayments = 0;
    let updatedInvoices = 0;

    for (const batch of chunkArray(itemsToProcess, BATCH_SIZE)) {
        const result = await prisma.$transaction(async (tx) => {
            let batchCreated = 0;
            let batchUpdated = 0;

            for (const item of batch) {
                if (item.createPayment) {
                    await tx.payment.create({
                        data: {
                            invoice_id: item.invoice.id,
                            payment_method: PAYMENT_METHOD,
                            transaction_code: item.transactionCode,
                            amount: item.remainingAmount,
                            status: PaymentStatus.SUCCESS,
                            paid_at: item.paidAt
                        }
                    });
                    batchCreated += 1;
                }

                if (item.updateInvoiceStatus) {
                    await tx.invoice.update({
                        where: { id: item.invoice.id },
                        data: {
                            status: InvoiceStatus.PAID,
                            paid_at: item.paidAt
                        }
                    });
                    batchUpdated += 1;
                }
            }

            return { batchCreated, batchUpdated };
        }, {
            maxWait: 10_000,
            timeout: 60_000
        });

        createdPayments += result.batchCreated;
        updatedInvoices += result.batchUpdated;
        console.log(
            `Processed ${createdPayments} payments, ${updatedInvoices} invoices`
        );
    }

    const validation = await validateAfterExecute();
    console.log("Validation after execute:");
    console.log(`- created_payments: ${createdPayments}`);
    console.log(`- updated_invoices: ${updatedInvoices}`);
    console.log(`- target_invoices: ${validation.targetInvoices}`);
    console.log(`- paid_invoices: ${validation.paidInvoices}`);
    console.log(`- invoices_without_success_payment: ${validation.withoutSuccessfulPayment}`);
    console.log(`- invoices_underpaid: ${validation.underpaidInvoices}`);
    console.log(`- successful_payments: ${validation.successfulPayments}`);

    if (
        validation.targetInvoices !== validation.paidInvoices
        || validation.withoutSuccessfulPayment > 0
        || validation.underpaidInvoices > 0
    ) {
        throw new Error("Payment seed validation failed.");
    }
}

async function validateAfterExecute() {
    const invoices = await getTargetInvoices();
    const paidInvoices = invoices.filter((invoice) =>
        invoice.status === InvoiceStatus.PAID
    ).length;
    const withoutSuccessfulPayment = invoices.filter((invoice) =>
        !invoice.payments.some((payment) => payment.status === PaymentStatus.SUCCESS)
    ).length;
    const underpaidInvoices = invoices.filter((invoice) =>
        getSuccessfulPaidAmount(invoice).lt(invoice.total_amount)
    ).length;
    const successfulPayments = invoices.reduce(
        (sum, invoice) =>
            sum + invoice.payments.filter((payment) =>
                payment.status === PaymentStatus.SUCCESS
            ).length,
        0
    );

    return {
        targetInvoices: invoices.length,
        paidInvoices,
        withoutSuccessfulPayment,
        underpaidInvoices,
        successfulPayments
    };
}

const main = async () => {
    const args = new Set(process.argv.slice(2));
    if (args.has("--execute")) {
        await runExecute();
        return;
    }

    await runDryRun();
};

main()
    .catch((error: unknown) => {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
