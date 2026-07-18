import {
    ContractStatus
} from "@prisma/client";
import { prisma } from "../src/config/database.js";
import { generateMonthlyInvoicesService } from "../src/services/invoice.service.js";

const TARGET_YEAR = 2026;
const TARGET_MONTHS = [1, 2, 3, 4, 5, 6] as const;
let selectedMonthNumbers: readonly number[] = TARGET_MONTHS;

type TargetMonth = {
    month: number;
    year: number;
    label: string;
};

type MonthPlan = {
    target: TargetMonth;
    totalContracts: number;
    existingInvoices: number;
    plannedCreate: number;
    missingUtilityReadings: Array<{
        contract_id: number;
        apartment_id: number;
        invoice_code: string;
    }>;
};

const padMonth = (month: number) => month.toString().padStart(2, "0");

const buildInvoiceCode = (contractId: number, month: number, year: number) =>
    `INV-${contractId}-${year}${padMonth(month)}`;

const isFirstRentalMonth = (
    startDate: Date,
    month: number,
    year: number
) => startDate.getUTCFullYear() === year
    && startDate.getUTCMonth() + 1 === month;

const isFirstChargeableRentalMonth = async (contract: {
    id: number;
    tenant_id: number;
    apartment_id: number;
    start_date: Date;
}, month: number, year: number) => {
    if (!isFirstRentalMonth(contract.start_date, month, year)) {
        return false;
    }

    const previousContract = await prisma.rentalContract.findFirst({
        where: {
            id: { not: contract.id },
            tenant_id: contract.tenant_id,
            apartment_id: contract.apartment_id,
            end_date: { lte: contract.start_date }
        },
        select: { id: true }
    });

    return previousContract === null;
};

const getTargetMonths = (): TargetMonth[] =>
    selectedMonthNumbers.map((month) => ({
        month,
        year: TARGET_YEAR,
        label: `${padMonth(month)}/${TARGET_YEAR}`
    }));

function applyMonthArgs(args: Set<string>) {
    const monthArg = [...args].find((arg) => arg.startsWith("--month="));
    if (!monthArg) {
        return;
    }

    const month = Number(monthArg.slice("--month=".length));
    if (!TARGET_MONTHS.includes(month as typeof TARGET_MONTHS[number])) {
        throw new Error("Flag --month chỉ hỗ trợ giá trị 1..6 cho năm 2026.");
    }

    selectedMonthNumbers = [month];
}
async function buildMonthPlan(target: TargetMonth): Promise<MonthPlan> {
    const periodStart = new Date(Date.UTC(target.year, target.month - 1, 1));
    const periodEnd = new Date(Date.UTC(target.year, target.month, 1));
    const contracts = await prisma.rentalContract.findMany({
        where: {
            status: ContractStatus.ACTIVE,
            start_date: { lt: periodEnd },
            end_date: { gte: periodStart }
        },
        select: {
            id: true,
            apartment_id: true,
            start_date: true
        },
        orderBy: { id: "asc" }
    });
    const invoiceCodes = contracts.map((contract) =>
        buildInvoiceCode(contract.id, target.month, target.year)
    );
    const existingInvoices = invoiceCodes.length === 0
        ? []
        : await prisma.invoice.findMany({
            where: {
                invoice_code: {
                    in: invoiceCodes
                }
            },
            select: {
                invoice_code: true
            }
        });
    const existingInvoiceCodes = new Set(existingInvoices.map((invoice) =>
        invoice.invoice_code
    ));
    const contractsNeedingUtility: typeof contracts = [];
    for (const contract of contracts) {
        if (existingInvoiceCodes.has(buildInvoiceCode(
            contract.id,
            target.month,
            target.year
        ))) {
            continue;
        }

        if (!await isFirstChargeableRentalMonth(
            contract,
            target.month,
            target.year
        )) {
            contractsNeedingUtility.push(contract);
        }
    }
    const utilityRows = contractsNeedingUtility.length === 0
        ? []
        : await prisma.utilityReading.findMany({
            where: {
                apartment_id: {
                    in: contractsNeedingUtility.map((contract) =>
                        contract.apartment_id
                    )
                },
                month: target.month,
                year: target.year
            },
            select: {
                apartment_id: true
            }
        });
    const apartmentIdsWithUtility = new Set(utilityRows.map((reading) =>
        reading.apartment_id
    ));
    const missingUtilityReadings = contractsNeedingUtility
        .filter((contract) => !apartmentIdsWithUtility.has(contract.apartment_id))
        .map((contract) => ({
            contract_id: contract.id,
            apartment_id: contract.apartment_id,
            invoice_code: buildInvoiceCode(
                contract.id,
                target.month,
                target.year
            )
        }));

    return {
        target,
        totalContracts: contracts.length,
        existingInvoices: existingInvoiceCodes.size,
        plannedCreate: contracts.length - existingInvoiceCodes.size,
        missingUtilityReadings
    };
}

async function buildPlan() {
    return Promise.all(getTargetMonths().map(buildMonthPlan));
}

function printPlan(plans: MonthPlan[]) {
    console.log("Seed invoices + invoice_items cho 01/2026 -> 06/2026");
    for (const plan of plans) {
        console.log(
            `- ${plan.target.label}: contracts=${plan.totalContracts}, `
            + `existing=${plan.existingInvoices}, `
            + `will_create=${plan.plannedCreate}, `
            + `missing_utility=${plan.missingUtilityReadings.length}`
        );
    }

    const totalContracts = plans.reduce(
        (sum, plan) => sum + plan.totalContracts,
        0
    );
    const totalExisting = plans.reduce(
        (sum, plan) => sum + plan.existingInvoices,
        0
    );
    const totalCreate = plans.reduce(
        (sum, plan) => sum + plan.plannedCreate,
        0
    );
    const missing = plans.flatMap((plan) => plan.missingUtilityReadings);

    console.log(`Tổng hợp: contracts=${totalContracts}, existing=${totalExisting}, will_create=${totalCreate}, missing_utility=${missing.length}`);
    if (missing.length > 0) {
        console.log("Thiếu utility readings:");
        for (const item of missing.slice(0, 20)) {
            console.log(
                `- contract_id=${item.contract_id}, apartment_id=${item.apartment_id}, invoice_code=${item.invoice_code}`
            );
        }
        if (missing.length > 20) {
            console.log(`... còn ${missing.length - 20} dòng thiếu`);
        }
    }
}

async function runDryRun() {
    const plans = await buildPlan();
    printPlan(plans);

    if (plans.some((plan) => plan.missingUtilityReadings.length > 0)) {
        process.exitCode = 1;
    }
}

async function runExecute() {
    const plans = await buildPlan();
    printPlan(plans);

    const missing = plans.flatMap((plan) => plan.missingUtilityReadings);
    if (missing.length > 0) {
        throw new Error(
            "Dừng execute vì còn thiếu utility readings cho hóa đơn cần tạo."
        );
    }

    const before = await getSideEffectCounts();
    const results = [];

    for (const target of getTargetMonths()) {
        const result = await generateMonthlyInvoicesService({
            month: target.month,
            year: target.year,
            notify: false
        });
        results.push(result);
        console.log(
            `Execute ${target.label}: created=${result.created_count}, `
            + `skipped=${result.skipped_count}, `
            + `missing_utility=${result.missing_utility_reading_count}`
        );
    }

    const after = await getSideEffectCounts();
    const validation = await validateTargetInvoices();

    console.log("Validation sau execute:");
    console.log(`- invoices_after_seed: ${validation.invoiceCount}`);
    console.log(`- invoice_items_after_seed: ${validation.invoiceItemCount}`);
    console.log(`- invoices_without_items: ${validation.invoicesWithoutItems}`);
    console.log(`- payments_created_by_script: ${after.payments - before.payments}`);
    console.log(`- notifications_created_by_script: ${after.notifications - before.notifications}`);
    console.log(`- total_created: ${results.reduce((sum, result) => sum + result.created_count, 0)}`);
    console.log(`- total_skipped: ${results.reduce((sum, result) => sum + result.skipped_count, 0)}`);
    console.log(`- total_missing_utility: ${results.reduce((sum, result) => sum + result.missing_utility_reading_count, 0)}`);

    if (
        validation.invoicesWithoutItems > 0
        || after.payments !== before.payments
        || after.notifications !== before.notifications
    ) {
        throw new Error("Validation invoice seed không đạt.");
    }
}

async function getSideEffectCounts() {
    const [payments, notifications] = await prisma.$transaction([
        prisma.payment.count(),
        prisma.notification.count()
    ]);

    return {
        payments,
        notifications
    };
}

async function validateTargetInvoices() {
    await buildPlan();
    const invoiceCodes: string[] = [];

    for (const target of getTargetMonths()) {
        const periodStart = new Date(Date.UTC(target.year, target.month - 1, 1));
        const periodEnd = new Date(Date.UTC(target.year, target.month, 1));
        const contracts = await prisma.rentalContract.findMany({
            where: {
                status: ContractStatus.ACTIVE,
                start_date: { lt: periodEnd },
                end_date: { gte: periodStart }
            },
            select: { id: true }
        });
        invoiceCodes.push(...contracts.map((contract) =>
            buildInvoiceCode(contract.id, target.month, target.year)
        ));
    }

    const invoices = invoiceCodes.length === 0
        ? []
        : await prisma.invoice.findMany({
            where: {
                invoice_code: {
                    in: invoiceCodes
                }
            },
            select: {
                id: true,
                items: {
                    select: {
                        id: true
                    }
                }
            }
        });

    return {
        invoiceCount: invoices.length,
        invoiceItemCount: invoices.reduce(
            (sum, invoice) => sum + invoice.items.length,
            0
        ),
        invoicesWithoutItems: invoices.filter((invoice) =>
            invoice.items.length === 0
        ).length
    };
}

const main = async () => {
    const args = new Set(process.argv.slice(2));
    applyMonthArgs(args);

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
