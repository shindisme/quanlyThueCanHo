import { Prisma } from "@prisma/client";

export type BillingInvoiceItem = {
    item_name: string;
    quantity: number;
    unit_price: number;
    amount: number;
};

export type ElectricTierDetail = {
    tier: number;
    label: string;
    quantity: number;
    unit_price: number;
    amount: number;
};

const MANAGEMENT_FEE_PER_M2 = 10_000;
const SERVICE_FEE = 300_000;
const WATER_UNIT_PRICE = 25_000;

const ELECTRIC_TIERS = [
    { limit: 50, unitPrice: 1_984 },
    { limit: 50, unitPrice: 2_050 },
    { limit: 100, unitPrice: 2_380 },
    { limit: 100, unitPrice: 2_998 },
    { limit: 100, unitPrice: 3_350 },
    { limit: null, unitPrice: 3_460 }
] as const;

const toDecimal = (value: Prisma.Decimal | number | string) =>
    new Prisma.Decimal(value);

const roundDecimalMoney = (
    value: Prisma.Decimal | number | string
) => toDecimal(value).toDecimalPlaces(
    2,
    Prisma.Decimal.ROUND_HALF_UP
);

const roundMoney = (
    value: Prisma.Decimal | number | string
) => roundDecimalMoney(value).toNumber();

const managementFeeAmount = (
    area: Prisma.Decimal | number | string
) => roundMoney(toDecimal(area).mul(MANAGEMENT_FEE_PER_M2));

const buildElectricTierLabel = (
    tier: number,
    from: number,
    to: number | null
) => to === null
    ? `Bậc ${tier} (${from}+ kWh)`
    : `Bậc ${tier} (${from}-${to} kWh)`;

export const calculateElectricTierDetails = (
    consumption: Prisma.Decimal | number | string
): ElectricTierDetail[] => {
    let remaining = toDecimal(consumption);
    if (remaining.lessThanOrEqualTo(0)) {
        return [];
    }

    let usedLimit = 0;
    const details: ElectricTierDetail[] = [];

    for (const [index, tier] of ELECTRIC_TIERS.entries()) {
        if (remaining.lessThanOrEqualTo(0)) {
            break;
        }

        const quantity = tier.limit === null
            ? remaining
            : Prisma.Decimal.min(remaining, tier.limit);
        const amount = roundMoney(quantity.mul(tier.unitPrice));
        const from = usedLimit === 0 ? 0 : usedLimit + 1;
        const to = tier.limit === null ? null : usedLimit + tier.limit;

        details.push({
            tier: index + 1,
            label: buildElectricTierLabel(index + 1, from, to),
            quantity: roundMoney(quantity),
            unit_price: tier.unitPrice,
            amount
        });

        remaining = remaining.minus(quantity);
        if (tier.limit !== null) {
            usedLimit += tier.limit;
        }
    }

    return details;
};

export const calculateElectricAmount = (
    consumption: Prisma.Decimal | number | string
) => roundMoney(calculateElectricTierDetails(consumption).reduce(
    (sum, detail) => sum.plus(detail.amount),
    new Prisma.Decimal(0)
));
const averageElectricUnitPrice = (
    consumption: Prisma.Decimal | number | string,
    amount: number
) => {
    const quantity = toDecimal(consumption);
    return quantity.lessThanOrEqualTo(0)
        ? 0
        : roundMoney(toDecimal(amount).div(quantity));
};

export const sumBillingItems = (
    items: BillingInvoiceItem[]
) => roundMoney(items.reduce(
    (sum, item) => sum.plus(item.amount),
    new Prisma.Decimal(0)
));

export const buildFirstRentalInvoiceItems = (input: {
    depositAmount: Prisma.Decimal | number | string;
    monthlyRent: Prisma.Decimal | number | string;
    area: Prisma.Decimal | number | string;
}): BillingInvoiceItem[] => {
    const depositAmount = roundMoney(input.depositAmount);
    const rentAmount = roundMoney(input.monthlyRent);
    const area = roundMoney(input.area);
    const managementAmount = managementFeeAmount(input.area);

    return [
        {
            item_name: "Tiền cọc",
            quantity: 1,
            unit_price: depositAmount,
            amount: depositAmount
        },
        {
            item_name: "Tiền thuê phòng tháng đầu tiên",
            quantity: 1,
            unit_price: rentAmount,
            amount: rentAmount
        },
        {
            item_name: "Phí quản lý",
            quantity: area,
            unit_price: MANAGEMENT_FEE_PER_M2,
            amount: managementAmount
        },
        {
            item_name: "Phí dịch vụ",
            quantity: 1,
            unit_price: SERVICE_FEE,
            amount: SERVICE_FEE
        }
    ];
};

export const buildRecurringMonthlyInvoiceItems = (input: {
    monthlyRent: Prisma.Decimal | number | string;
    area: Prisma.Decimal | number | string;
    electricConsumption: Prisma.Decimal | number | string;
    waterConsumption: Prisma.Decimal | number | string;
    periodLabel: string;
}): BillingInvoiceItem[] => {
    const rentAmount = roundMoney(input.monthlyRent);
    const area = roundMoney(input.area);
    const managementAmount = managementFeeAmount(input.area);
    const electricQuantity = roundMoney(input.electricConsumption);
    const electricAmount = calculateElectricAmount(input.electricConsumption);
    const waterQuantity = roundMoney(input.waterConsumption);
    const waterAmount = roundMoney(
        toDecimal(input.waterConsumption).mul(WATER_UNIT_PRICE)
    );

    return [
        {
            item_name: `Phí thuê căn hộ ${input.periodLabel}`,
            quantity: 1,
            unit_price: rentAmount,
            amount: rentAmount
        },
        {
            item_name: `Phí quản lý ${input.periodLabel}`,
            quantity: area,
            unit_price: MANAGEMENT_FEE_PER_M2,
            amount: managementAmount
        },
        {
            item_name: `Tiền điện ${input.periodLabel}`,
            quantity: electricQuantity,
            unit_price: averageElectricUnitPrice(
                input.electricConsumption,
                electricAmount
            ),
            amount: electricAmount
        },
        {
            item_name: `Tiền nước ${input.periodLabel}`,
            quantity: waterQuantity,
            unit_price: WATER_UNIT_PRICE,
            amount: waterAmount
        },
        {
            item_name: `Phí dịch vụ ${input.periodLabel}`,
            quantity: 1,
            unit_price: SERVICE_FEE,
            amount: SERVICE_FEE
        }
    ];
};
