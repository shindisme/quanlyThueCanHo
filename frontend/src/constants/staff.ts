export const STAFF_POSITIONS = [
  "Quản lý",
  "Bảo vệ",
  "Vệ sinh",
  "Kỹ thuật",
  "Kế toán",
] as const;

export type StaffPosition = (typeof STAFF_POSITIONS)[number];

export const ACCOUNT_POSITIONS: readonly StaffPosition[] = ["Quản lý", "Kỹ thuật"];
