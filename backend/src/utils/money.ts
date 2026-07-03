export const MAX_DECIMAL_12_2 = 9_999_999_999.99;

export const toMoneyCents = (value: number) =>
    Math.round(value * 100);

const hasDecimal12_2Representation = (value: number) => {
    if (
        !Number.isFinite(value)
        || value > MAX_DECIMAL_12_2
    ) {
        return false;
    }

    const cents = toMoneyCents(value);

    return Number.isSafeInteger(cents)
        && cents / 100 === value;
};

export const isPositiveDecimal12_2Amount = (
    value: number
) => value > 0 && hasDecimal12_2Representation(value);

export const isNonNegativeDecimal12_2Amount = (
    value: number
) => value >= 0 && hasDecimal12_2Representation(value);

export const isDecimal12_2Amount =
    isPositiveDecimal12_2Amount;
