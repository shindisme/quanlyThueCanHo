export type Role = "ADMIN" | "MANAGER" | "STAFF" | "TENANT";

export type UserStatus = "ACTIVE" | "INACTIVE" | "BANNED";

export type BuildingStatus = "ACTIVE" | "INACTIVE";

export type ApartmentStatus = "AVAILABLE" | "RESERVED" | "RENTED" | "MAINTENANCE" | "VACATING_SOON";

export type ContractStatus = "ACTIVE" | "ENDED" | "FORCE_TERMINATED";

export type InvoiceStatus = "PAID" | "UNPAID" | "OVERDUE";

export type InvoiceType = "DEPOSIT" | "FIRST_RENT" | "MONTHLY" | "MAINTENANCE" | "FINAL_SETTLEMENT";

export type PaymentMethod = "BANK_TRANSFER" | "E_WALLET" | "CASH";

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";

export type ReservationStatus = "ACTIVE" | "CONVERTED" | "FORFEITED" | "CANCELLED";

export type Priority = "LOW" | "MEDIUM" | "HIGH";

export type RequestStatus = "PENDING" | "PROCESSING" | "NEEDS_RESCHEDULE" | "DONE" | "CANCELLED";

export type ScheduleStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

export type AttendanceStatus = "NOT_YET" | "ATTENDED" | "ABSENT";

export type ContractTerminationType = "TENANT_REQUEST" | "OVERDUE";

export type ContractTerminationStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "INSPECTION"
  | "SETTLING"
  | "COMPLETED"
  | "CANCELLED";

export type DepositPolicy = "REFUNDABLE" | "FORFEITED";

export type SettlementFinancialStatus =
  | "PENDING"
  | "AWAITING_PAYMENT"
  | "PARTIALLY_PAID"
  | "SETTLED";

export type NotificationType = "SYSTEM" | "INVOICE" | "MAINTENANCE" | "CHAT";

export type SenderType = "USER" | "CHATBOT";

export * from "./labels";
export * from "./badges";
