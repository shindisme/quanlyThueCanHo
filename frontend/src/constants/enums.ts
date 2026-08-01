export type Role = "ADMIN" | "MANAGER" | "STAFF" | "TENANT";

export type UserStatus = "ACTIVE" | "INACTIVE" | "BANNED";

export type BuildingStatus = "ACTIVE" | "INACTIVE";

export type ApartmentStatus = "AVAILABLE" | "RESERVED" | "RENTED" | "MAINTENANCE";

export type ContractStatus = "ACTIVE" | "ENDED";

export type InvoiceStatus = "PAID" | "UNPAID" | "OVERDUE";

export type PaymentMethod = "BANK_TRANSFER" | "E_WALLET" | "CASH";

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";

export type Priority = "LOW" | "MEDIUM" | "HIGH";

export type RequestStatus = "PENDING" | "PROCESSING" | "NEEDS_RESCHEDULE" | "DONE" | "CANCELLED";

export type ScheduleStatus = "PENDING" | "CONFIRMED" | "DONE" | "CANCELLED";

export type NotificationType = "SYSTEM" | "INVOICE" | "MAINTENANCE" | "CHAT";

export type SenderType = "USER" | "CHATBOT";

export * from "./labels";
export * from "./badges";
