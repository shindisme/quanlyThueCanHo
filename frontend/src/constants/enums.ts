export const ROLE_VALUES = ["ADMIN", "MANAGER", "STAFF", "TENANT"] as const;
export type Role = (typeof ROLE_VALUES)[number];

export const USER_STATUS_VALUES = ["ACTIVE", "INACTIVE", "BANNED"] as const;
export type UserStatus = (typeof USER_STATUS_VALUES)[number];

export const BUILDING_STATUS_VALUES = ["ACTIVE", "INACTIVE"] as const;
export type BuildingStatus = (typeof BUILDING_STATUS_VALUES)[number];

export const APARTMENT_STATUS_VALUES = [
  "AVAILABLE", "RESERVED", "RENTED", "MAINTENANCE", "VACATING_SOON",
] as const;
export type ApartmentStatus = (typeof APARTMENT_STATUS_VALUES)[number];

export const CONTRACT_STATUS_VALUES = ["ACTIVE", "ENDED"] as const;
export type ContractStatus = (typeof CONTRACT_STATUS_VALUES)[number];

export const INVOICE_PERSISTED_STATUS_VALUES = ["PAID", "UNPAID"] as const;
export type InvoicePersistedStatus = (typeof INVOICE_PERSISTED_STATUS_VALUES)[number];

// OVERDUE is derived from UNPAID + due_date and is never persisted by the API.
export const INVOICE_STATUS_VALUES = [...INVOICE_PERSISTED_STATUS_VALUES, "OVERDUE"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUS_VALUES)[number];

export const INVOICE_TYPE_VALUES = [
  "DEPOSIT", "FIRST_RENT", "MONTHLY", "MAINTENANCE", "FINAL_SETTLEMENT", "REFUND",
] as const;
export type InvoiceType = (typeof INVOICE_TYPE_VALUES)[number];

export const PAYMENT_METHOD_VALUES = ["E_WALLET", "CASH"] as const;
export type PaymentMethod = (typeof PAYMENT_METHOD_VALUES)[number];

export const PAYMENT_STATUS_VALUES = ["PENDING", "SUCCESS", "FAILED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUS_VALUES)[number];

export const RESERVATION_STATUS_VALUES = [
  "ACTIVE", "CONVERTED", "FORFEITED", "CANCELLED",
] as const;
export type ReservationStatus = (typeof RESERVATION_STATUS_VALUES)[number];

export const PRIORITY_VALUES = ["LOW", "MEDIUM", "HIGH"] as const;
export type Priority = (typeof PRIORITY_VALUES)[number];

export const REQUEST_STATUS_VALUES = [
  "PENDING", "PROCESSING", "NEEDS_RESCHEDULE", "DONE", "CANCELLED",
] as const;
export type RequestStatus = (typeof REQUEST_STATUS_VALUES)[number];

export const SCHEDULE_STATUS_VALUES = ["PENDING", "CONFIRMED", "CANCELLED"] as const;
export type ScheduleStatus = (typeof SCHEDULE_STATUS_VALUES)[number];

export const ATTENDANCE_STATUS_VALUES = ["NOT_YET", "ATTENDED", "ABSENT"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUS_VALUES)[number];

export const CONTRACT_TERMINATION_TYPE_VALUES = ["TENANT_REQUEST", "MANAGER_REQUEST", "OVERDUE"] as const;
export type ContractTerminationType = (typeof CONTRACT_TERMINATION_TYPE_VALUES)[number];

export const CONTRACT_TERMINATION_STATUS_VALUES = [
  "PENDING", "APPROVED", "REJECTED", "INSPECTION", "SETTLING", "COMPLETED", "CANCELLED",
] as const;
export type ContractTerminationStatus = (typeof CONTRACT_TERMINATION_STATUS_VALUES)[number];

export const OPEN_CONTRACT_TERMINATION_STATUSES = [
  "PENDING", "APPROVED", "INSPECTION", "SETTLING",
] as const satisfies readonly ContractTerminationStatus[];

export function isOpenContractTerminationStatus(status: ContractTerminationStatus): boolean {
  return OPEN_CONTRACT_TERMINATION_STATUSES.some((item) => item === status);
}

export const DEPOSIT_POLICY_VALUES = ["REFUNDABLE", "FORFEITED"] as const;
export type DepositPolicy = (typeof DEPOSIT_POLICY_VALUES)[number];

export const SETTLEMENT_FINANCIAL_STATUS_VALUES = [
  "PENDING", "AWAITING_PAYMENT", "PARTIALLY_PAID", "SETTLED",
] as const;
export type SettlementFinancialStatus = (typeof SETTLEMENT_FINANCIAL_STATUS_VALUES)[number];

export const NOTIFICATION_TYPE_VALUES = [
  "GENERAL", "SYSTEM", "INVOICE", "MAINTENANCE", "CHAT",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPE_VALUES)[number];

export const SENDER_TYPE_VALUES = ["USER", "CHATBOT"] as const;
export type SenderType = (typeof SENDER_TYPE_VALUES)[number];