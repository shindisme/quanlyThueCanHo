// Cac enum trang thai tuong ung voi Prisma schema

export type Role = "ADMIN" | "MANAGER" | "STAFF" | "TENANT";

export type UserStatus = "ACTIVE" | "INACTIVE" | "BANNED";

export type BuildingStatus = "ACTIVE" | "MAINTENANCE";

export type ApartmentStatus = "AVAILABLE" | "RENTED" | "MAINTENANCE";

export type ContractStatus = "ACTIVE" | "ENDED" | "LIQUIDATED";

export type InvoiceStatus = "PAID" | "UNPAID" | "OVERDUE";

export type PaymentMethod = "BANK_TRANSFER" | "MOMO" | "VNPAY" | "CASH";

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";

export type Priority = "LOW" | "MEDIUM" | "HIGH";

export type RequestStatus = "PENDING" | "PROCESSING" | "DONE" | "CANCELLED";

export type ScheduleStatus = "PENDING" | "CONFIRMED" | "DONE" | "CANCELLED";

export type NotificationType = "SYSTEM" | "INVOICE" | "MAINTENANCE" | "CHAT";

export type SenderType = "USER" | "CHATBOT";

// Map trang thai sang tieng Viet de hien thi tren UI
export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: "Hoat dong",
  INACTIVE: "Ngung hoat dong",
  BANNED: "Bi khoa",
};

export const APARTMENT_STATUS_LABELS: Record<ApartmentStatus, string> = {
  AVAILABLE: "Con trong",
  RENTED: "Dang thue",
  MAINTENANCE: "Bao tri",
};

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  ACTIVE: "Hieu luc",
  ENDED: "Da ket thuc",
  LIQUIDATED: "Da thanh ly",
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  PAID: "Da thanh toan",
  UNPAID: "Chua thanh toan",
  OVERDUE: "Qua han",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Cho xu ly",
  SUCCESS: "Thanh cong",
  FAILED: "That bai",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  BANK_TRANSFER: "Chuyen khoan",
  MOMO: "MoMo",
  VNPAY: "VNPay",
  CASH: "Tien mat",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: "Thap",
  MEDIUM: "Trung binh",
  HIGH: "Cao",
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  PENDING: "Moi tao",
  PROCESSING: "Dang xu ly",
  DONE: "Hoan thanh",
  CANCELLED: "Da huy",
};

export const SCHEDULE_STATUS_LABELS: Record<ScheduleStatus, string> = {
  PENDING: "Cho xac nhan",
  CONFIRMED: "Da xac nhan",
  DONE: "Hoan thanh",
  CANCELLED: "Da huy",
};

// Map trang thai sang mau Badge
export const APARTMENT_STATUS_COLORS: Record<ApartmentStatus, string> = {
  AVAILABLE: "success",
  RENTED: "info",
  MAINTENANCE: "warning",
};

export const CONTRACT_STATUS_COLORS: Record<ContractStatus, string> = {
  ACTIVE: "success",
  ENDED: "gray",
  LIQUIDATED: "danger",
};

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  PAID: "success",
  UNPAID: "warning",
  OVERDUE: "danger",
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  PENDING: "warning",
  SUCCESS: "success",
  FAILED: "danger",
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  LOW: "gray",
  MEDIUM: "warning",
  HIGH: "danger",
};

export const REQUEST_STATUS_COLORS: Record<RequestStatus, string> = {
  PENDING: "warning",
  PROCESSING: "info",
  DONE: "success",
  CANCELLED: "gray",
};
