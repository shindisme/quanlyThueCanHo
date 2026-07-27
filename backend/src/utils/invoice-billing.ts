import { Prisma } from "@prisma/client";

export type BillingInvoiceItem = {
    item_name: string;
    quantity: number;
    unit_price: number;
    amount: number;
};

type MoneyInput = Prisma.Decimal | number | string;

export type BillingFeeSettings = {
    managementFee?: MoneyInput;
    managementFeePerM2?: MoneyInput;
    electricTierPrices?: readonly MoneyInput[];
    waterTierPrices?: readonly MoneyInput[];
    serviceFee?: MoneyInput;
};

export type ElectricTierDetail = {
    tier: number;
    label: string;
    quantity: number;
    unit_price: number;
    amount: number;
};
export type UtilityType = "ELECTRIC" | "WATER";

export type UtilityTierInvoiceItem<T extends BillingInvoiceItem> = T & {
    utility_type?: UtilityType;
    tier_details?: ElectricTierDetail[];
    electric_tier_details?: ElectricTierDetail[];
    water_tier_details?: ElectricTierDetail[];
};

const MANAGEMENT_FEE_PER_M2 = 10_000;
const SERVICE_FEE = 300_000;

const ELECTRIC_TIER_LIMITS = [
    50,
    50,
    100,
    100,
    100,
    null
] as const;
const DEFAULT_ELECTRIC_TIER_PRICES = [
    1_984,
    2_050,
    2_380,
    2_998,
    3_350,
    3_460
] as const;
const WATER_TIER_LIMITS_PER_PERSON = [
    4,
    2,
    null
] as const;
const DEFAULT_WATER_TIER_PRICES = [
    6_700,
    12_900,
    14_400
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

const roundMeterQuantity = (
    value: Prisma.Decimal | number | string
) => Math.max(0, Math.round(toDecimal(value).toNumber()));

const managementFeeAmount = (
    area: Prisma.Decimal | number | string,
    unitPrice: MoneyInput
) => roundMoney(toDecimal(area).mul(unitPrice));

const positivePersonCount = (value: number | undefined) =>
    Math.max(1, Math.trunc(value ?? 1));

const resolveElectricTiers = (
    unitPrices?: readonly MoneyInput[]
) => ELECTRIC_TIER_LIMITS.map((limit, index) => ({
    limit,
    unitPrice: roundMoney(
        unitPrices?.[index] ?? DEFAULT_ELECTRIC_TIER_PRICES[index] ?? 0
    )
}));

const resolveWaterTiers = (
    personCount: number,
    unitPrices?: readonly MoneyInput[]
) => WATER_TIER_LIMITS_PER_PERSON.map((limit, index) => ({
    limit: limit === null ? null : limit * personCount,
    unitPrice: roundMoney(
        unitPrices?.[index] ?? DEFAULT_WATER_TIER_PRICES[index] ?? 0
    )
}));

const buildElectricTierLabel = (
    tier: number,
    from: number,
    to: number | null
) => to === null
    ? `Bậc ${tier} (Trên ${from - 1} kWh)`
    : `Bậc ${tier} (${from}-${to} kWh)`;

const buildWaterTierLabel = (
    tier: number,
    from: number,
    to: number | null,
    personCount: number
) => to === null
    ? `Bậc ${tier} (${from}+ m³, ${personCount} người)`
    : `Bậc ${tier} (${from}-${to} m³, ${personCount} người)`;

export const calculateElectricTierDetails = (
    consumption: Prisma.Decimal | number | string,
    unitPrices?: readonly MoneyInput[]
): ElectricTierDetail[] => {
    let remaining = toDecimal(consumption);
    if (remaining.lessThanOrEqualTo(0)) {
        return [];
    }

    let usedLimit = 0;
    const details: ElectricTierDetail[] = [];

    for (const [index, tier] of resolveElectricTiers(unitPrices).entries()) {
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

export const calculateWaterTierDetails = (
    consumption: Prisma.Decimal | number | string,
    occupantCount: number | undefined,
    unitPrices?: readonly MoneyInput[]
): ElectricTierDetail[] => {
    let remaining = toDecimal(consumption);
    if (remaining.lessThanOrEqualTo(0)) {
        return [];
    }

    const personCount = positivePersonCount(occupantCount);
    let usedLimit = 0;
    const details: ElectricTierDetail[] = [];

    for (const [index, tier] of resolveWaterTiers(personCount, unitPrices).entries()) {
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
            label: buildWaterTierLabel(index + 1, from, to, personCount),
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
    consumption: Prisma.Decimal | number | string,
    unitPrices?: readonly MoneyInput[]
) => roundMoney(calculateElectricTierDetails(consumption, unitPrices).reduce(
    (sum, detail) => sum.plus(detail.amount),
    new Prisma.Decimal(0)
));

export const calculateWaterAmount = (
    consumption: Prisma.Decimal | number | string,
    occupantCount?: number,
    unitPrices?: readonly MoneyInput[]
) => roundMoney(calculateWaterTierDetails(
    consumption,
    occupantCount,
    unitPrices
).reduce(
    (sum, detail) => sum.plus(detail.amount),
    new Prisma.Decimal(0)
));


type UtilityItemInput = {
    item_name: string;
    quantity: number;
    unit_price: number;
    amount: number;
};

const TIER_ITEM_PATTERN =
    /^(Tiền điện|Tiền nước)(.*?)\s+-\s+(Bậc\s+(\d+)\s+\(.+\))$/u;
const UTILITY_ITEM_PATTERN = /^(Tiền điện|Tiền nước)\b/u;

const utilityTypeFromName = (name: string): UtilityType | undefined => {
    if (name.startsWith("Tiền điện")) {
        return "ELECTRIC";
    }

    if (name.startsWith("Tiền nước")) {
        return "WATER";
    }

    return undefined;
};

const withTierDetails = <T extends UtilityItemInput>(
    item: T,
    type: UtilityType,
    tierDetails: ElectricTierDetail[]
): UtilityTierInvoiceItem<T> => ({
    ...item,
    unit_price: tierDetails.length > 0 ? 0 : item.unit_price,
    utility_type: type,
    tier_details: tierDetails,
    ...(type === "ELECTRIC"
        ? { electric_tier_details: tierDetails }
        : { water_tier_details: tierDetails })
});

const sameMoney = (left: number, right: number) =>
    Math.abs(roundMoney(left) - roundMoney(right)) < 0.01;

const legacyTierDetails = (
    item: UtilityItemInput,
    type: UtilityType
) => {
    const calculated = type === "ELECTRIC"
        ? calculateElectricTierDetails(item.quantity)
        : calculateWaterTierDetails(item.quantity, undefined);
    const calculatedTotal = sumBillingItems(calculated.map((detail) => ({
        item_name: detail.label,
        quantity: detail.quantity,
        unit_price: detail.unit_price,
        amount: detail.amount
    })));

    if (calculated.length > 0 && sameMoney(calculatedTotal, item.amount)) {
        return calculated;
    }

    if (item.quantity <= 0 && item.amount <= 0) {
        return [];
    }

    return [{
        tier: 1,
        label: "Bậc 1 (theo hóa đơn)",
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.amount
    }];
};

export const attachUtilityTierDetails = <T extends UtilityItemInput>(
    items: T[]
): Array<UtilityTierInvoiceItem<T>> => {
    const result: Array<UtilityTierInvoiceItem<T>> = [];
    const groups = new Map<string, UtilityTierInvoiceItem<T>>();

    for (const item of items) {
        const tierMatch = item.item_name.match(TIER_ITEM_PATTERN);
        if (tierMatch) {
            const [, utilityName, period, label, tierText] = tierMatch;
            const type = utilityName === "Tiền điện" ? "ELECTRIC" : "WATER";
            const key = `${utilityName}${period}`;
            let group = groups.get(key);

            if (!group) {
                group = withTierDetails(
                    {
                        ...item,
                        item_name: key,
                        quantity: 0,
                        unit_price: 0,
                        amount: 0
                    },
                    type,
                    []
                );
                groups.set(key, group);
                result.push(group);
            }

            group.tier_details!.push({
                tier: Number(tierText),
                label,
                quantity: item.quantity,
                unit_price: item.unit_price,
                amount: item.amount
            });
            group.quantity = roundMoney(group.quantity + item.quantity);
            group.amount = roundMoney(group.amount + item.amount);
            continue;
        }

        if (UTILITY_ITEM_PATTERN.test(item.item_name)) {
            const type = utilityTypeFromName(item.item_name);
            result.push(type
                ? withTierDetails(item, type, legacyTierDetails(item, type))
                : item);
            continue;
        }

        result.push(item);
    }

    return result;
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
} & Pick<
    BillingFeeSettings,
    "managementFee" | "managementFeePerM2" | "serviceFee"
>): BillingInvoiceItem[] => {
    const rentAmount = roundMoney(input.monthlyRent);
    const area = roundMoney(input.area);
    const managementFee = roundMoney(input.managementFee ?? 0);
    const managementFeePerM2 = roundMoney(
        input.managementFeePerM2 ?? MANAGEMENT_FEE_PER_M2
    );
    const managementAmount = managementFeeAmount(
        input.area,
        managementFeePerM2
    );
    const serviceFee = roundMoney(input.serviceFee ?? SERVICE_FEE);

    const items: BillingInvoiceItem[] = [

        {
            item_name: "Tiền thuê phòng tháng đầu tiên",
            quantity: 1,
            unit_price: rentAmount,
            amount: rentAmount
        },
        {
            item_name: "Phí quản lý",
            quantity: area,
            unit_price: managementFeePerM2,
            amount: managementAmount
        }
    ];

    if (managementFee > 0) {
        items.push({
            item_name: "Phí quản lý cố định",
            quantity: 1,
            unit_price: managementFee,
            amount: managementFee
        });
    }

    items.push({
        item_name: "Phí dịch vụ",
        quantity: 1,
        unit_price: serviceFee,
        amount: serviceFee
    });

    return items;
};

export const buildRecurringMonthlyInvoiceItems = (input: {
    monthlyRent: Prisma.Decimal | number | string;
    area: Prisma.Decimal | number | string;
    electricConsumption: Prisma.Decimal | number | string;
    waterConsumption: Prisma.Decimal | number | string;
    occupantCount?: number;
    periodLabel: string;
} & BillingFeeSettings): BillingInvoiceItem[] => {
    const rentAmount = roundMoney(input.monthlyRent);
    const area = roundMoney(input.area);
    const managementFee = roundMoney(input.managementFee ?? 0);
    const managementFeePerM2 = roundMoney(
        input.managementFeePerM2 ?? MANAGEMENT_FEE_PER_M2
    );
    const managementAmount = managementFeeAmount(
        input.area,
        managementFeePerM2
    );
    const electricQuantity = roundMeterQuantity(input.electricConsumption);
    const waterQuantity = roundMeterQuantity(input.waterConsumption);
    const serviceFee = roundMoney(input.serviceFee ?? SERVICE_FEE);

    const items: BillingInvoiceItem[] = [
        {
            item_name: `Phí thuê căn hộ ${input.periodLabel}`,
            quantity: 1,
            unit_price: rentAmount,
            amount: rentAmount
        },
        {
            item_name: `Phí quản lý ${input.periodLabel}`,
            quantity: area,
            unit_price: managementFeePerM2,
            amount: managementAmount
        }
    ];

    if (managementFee > 0) {
        items.push({
            item_name: `Phí quản lý cố định ${input.periodLabel}`,
            quantity: 1,
            unit_price: managementFee,
            amount: managementFee
        });
    }

    const electricTierDetails = calculateElectricTierDetails(
        electricQuantity,
        input.electricTierPrices
    );
    items.push(...(electricTierDetails.length > 0
        ? electricTierDetails.map((detail) => ({
            item_name: `Tiền điện ${input.periodLabel} - ${detail.label}`,
            quantity: detail.quantity,
            unit_price: detail.unit_price,
            amount: detail.amount
        }))
        : [{
            item_name: `Tiền điện ${input.periodLabel}`,
            quantity: electricQuantity,
            unit_price: 0,
            amount: 0
        }]));

    const waterTierDetails = calculateWaterTierDetails(
        waterQuantity,
        input.occupantCount,
        input.waterTierPrices
    );
    items.push(...(waterTierDetails.length > 0
        ? waterTierDetails.map((detail) => ({
            item_name: `Tiền nước ${input.periodLabel} - ${detail.label}`,
            quantity: detail.quantity,
            unit_price: detail.unit_price,
            amount: detail.amount
        }))
        : [{
            item_name: `Tiền nước ${input.periodLabel}`,
            quantity: waterQuantity,
            unit_price: 0,
            amount: 0
        }]));

    items.push({
        item_name: `Phí dịch vụ ${input.periodLabel}`,
        quantity: 1,
        unit_price: serviceFee,
        amount: serviceFee
    });

    return items;
};