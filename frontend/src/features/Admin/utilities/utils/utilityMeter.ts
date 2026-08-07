export const meter = (value: number | string | null | undefined): number =>
  Math.round(Number(value || 0));

export const meterUsage = (
  oldValue: number | string | null | undefined,
  newValue: number | string | null | undefined
): number => Math.max(0, meter(newValue) - meter(oldValue));
