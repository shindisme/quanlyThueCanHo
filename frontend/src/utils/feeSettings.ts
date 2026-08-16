import type { InvoiceItem, InvoiceElectricTierDetail } from "../types";

export interface FeeSettings {
  electricityRates: number[];
  waterRates: number[];
  internetRate: number;
  managementFeePerM2: number;
}

type SavedFeeSettings = Partial<FeeSettings> & {
  electricTierPrices?: number[];
  waterTierPrices?: number[];
};

export const DEFAULT_FEES: FeeSettings = {
  electricityRates: [1984, 2050, 2380, 2998, 3350, 3460],
  waterRates: [6700, 12900, 14400],
  internetRate: 300000,
  managementFeePerM2: 10000,
};

export const ELECTRICITY_TIER_LABELS = [
  "Bậc 1 (0-50 kWh)",
  "Bậc 2 (51-100 kWh)",
  "Bậc 3 (101-200 kWh)",
  "Bậc 4 (201-300 kWh)",
  "Bậc 5 (301-400 kWh)",
  "Bậc 6 (Trên 400 kWh)",
] as const;

export const WATER_TIER_LABELS = [
  "Bậc 1 (Đến 4 m³/người)",
  "Bậc 2 (Trên 4-6 m³/người)",
  "Bậc 3 (Trên 6 m³/người)",
] as const;

// Ngưỡng tiêu thụ là quy tắc nghiệp vụ cố định; trang cài đặt chỉ thay đổi đơn giá.
export const ELECTRICITY_TIER_LIMITS = [50, 50, 100, 100, 100, null] as const;
export const WATER_TIER_LIMITS_PER_PERSON = [4, 2, null] as const;

const normalizeRates = (value: unknown, fallback: number[]) => {
  if (!Array.isArray(value) || value.length !== fallback.length) return fallback;
  const rates = value.map(Number);
  return rates.every(Number.isFinite) ? rates : fallback;
};

export const normalizeFeeSettings = (saved: SavedFeeSettings): FeeSettings => ({
  electricityRates: normalizeRates(
    saved.electricityRates ?? saved.electricTierPrices,
    DEFAULT_FEES.electricityRates
  ),
  waterRates: normalizeRates(
    saved.waterRates ?? saved.waterTierPrices,
    DEFAULT_FEES.waterRates
  ),
  internetRate: Number.isFinite(Number(saved.internetRate))
    ? Number(saved.internetRate)
    : DEFAULT_FEES.internetRate,
  managementFeePerM2: Number.isFinite(Number(saved.managementFeePerM2))
    ? Number(saved.managementFeePerM2)
    : DEFAULT_FEES.managementFeePerM2,
});

export const readFeeSettings = (): FeeSettings => {
  try {
    const saved = localStorage.getItem("system_fee_settings");
    return saved ? normalizeFeeSettings(JSON.parse(saved)) : DEFAULT_FEES;
  } catch {
    return DEFAULT_FEES;
  }
};

export const saveFeeSettings = (settings: Partial<FeeSettings>) => {
  try {
    const current = readFeeSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem("system_fee_settings", JSON.stringify(updated));
  } catch (err) {
    if (import.meta.env.DEV) console.error("Lỗi lưu fee settings:", err);
  }
};

const roundMoney = (value: number) => Math.round(value * 100) / 100;

const normalizeOccupantCount = (value?: number) =>
  Math.max(1, Math.trunc(Number(value) || 1));

const waterLimitsFor = (occupantCount?: number) => {
  const personCount = normalizeOccupantCount(occupantCount);
  return WATER_TIER_LIMITS_PER_PERSON.map((limit) =>
    limit === null ? null : limit * personCount
  );
};

const calculateTiers = (
  quantity: number,
  prices: number[],
  limits: readonly (number | null)[],
  unit: "kWh" | "m³"
): InvoiceElectricTierDetail[] => {
  let remaining = Math.max(0, Number(quantity) || 0);
  let usedLimit = 0;
  const details: InvoiceElectricTierDetail[] = [];

  limits.forEach((limit, index) => {
    if (remaining <= 0) return;

    const tierQuantity = limit === null ? remaining : Math.min(remaining, limit);
    const from = usedLimit === 0 ? 0 : usedLimit + 1;
    const to = limit === null ? null : usedLimit + limit;
    const label = to === null
      ? `Bậc ${index + 1} (Trên ${from - 1} ${unit})`
      : `Bậc ${index + 1} (${from}-${to} ${unit})`;

    details.push({
      tier: index + 1,
      label,
      quantity: roundMoney(tierQuantity),
      unit_price: prices[index] ?? 0,
      amount: roundMoney(tierQuantity * (prices[index] ?? 0)),
    });

    remaining -= tierQuantity;
    if (limit !== null) usedLimit += limit;
  });

  return details;
};

const isFallbackTier = (details: InvoiceElectricTierDetail[]) =>
  details.length === 1 && details[0].label.includes("theo hóa đơn");

export const getUtilityUnit = (item: InvoiceItem) => {
  const name = (item.item_name || "").toLowerCase();
  if (item.utility_type === "WATER" || name.includes("nước") || name.includes("water")) return "m³";
  if (item.utility_type === "ELECTRIC" || name.includes("điện") || name.includes("electric")) return "kWh";
  return "";
};

export const getDisplayTierDetails = (item: InvoiceItem, occupantCount?: number) => {
  const details = item.tier_details ?? item.electric_tier_details ?? item.water_tier_details ?? [];
  if (details.length > 0 && !isFallbackTier(details)) return details;

  const settings = readFeeSettings();
  const name = (item.item_name || "").toLowerCase();

  if (item.utility_type === "ELECTRIC" || name.includes("điện") || name.includes("electric")) {
    return calculateTiers(Number(item.quantity), settings.electricityRates, ELECTRICITY_TIER_LIMITS, "kWh");
  }

  if (item.utility_type === "WATER" || name.includes("nước") || name.includes("water")) {
    return calculateTiers(Number(item.quantity), settings.waterRates, waterLimitsFor(occupantCount), "m³");
  }

  return details;
};

export const getDisplayItemAmount = (item: InvoiceItem, occupantCount?: number) => {
  const details = getDisplayTierDetails(item, occupantCount);
  if (details.length === 0) return Number(item.amount);

  return roundMoney(details.reduce((sum, detail) => sum + Number(detail.amount), 0));
};
