export const VIEWING_TIME_VALUES = ["09:00", "11:00", "13:00", "15:00"] as const;

export type ViewingTime = (typeof VIEWING_TIME_VALUES)[number];

export const VIEWING_TIME_OPTIONS = VIEWING_TIME_VALUES.map((value) => ({
  value,
  label: value,
}));
