import type { BadgeVariant } from "../components/ui/Badge";
import type {
  ApartmentStatus,
  AttendanceStatus,
  BuildingStatus,
  ContractStatus,
  ContractTerminationStatus,
  ContractTerminationType,
  DepositPolicy,
  InvoiceStatus,
  InvoiceType,
  PaymentMethod,
  PaymentStatus,
  Priority,
  RequestStatus,
  ReservationStatus,
  Role,
  ScheduleStatus,
  SettlementFinancialStatus,
  UserStatus,
} from "./enums";
import {
  APARTMENT_STATUS_LABELS,
  ATTENDANCE_STATUS_LABELS,
  BUILDING_STATUS_LABELS,
  CONTRACT_STATUS_LABELS,
  CONTRACT_TERMINATION_STATUS_LABELS,
  CONTRACT_TERMINATION_TYPE_LABELS,
  DEPOSIT_POLICY_LABELS,
  INVOICE_STATUS_LABELS,
  INVOICE_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PRIORITY_LABELS,
  REQUEST_STATUS_LABELS,
  RESERVATION_STATUS_LABELS,
  ROLE_LABELS,
  SCHEDULE_STATUS_LABELS,
  SETTLEMENT_FINANCIAL_STATUS_LABELS,
  USER_STATUS_LABELS,
} from "./labels";

export interface BadgeConfig {
  label: string;
  badge: BadgeVariant;
}

const createBadgeConfig = <T extends string>(
  labels: Record<T, string>,
  colors: Record<T, BadgeVariant>
): Record<T, BadgeConfig> => Object.fromEntries(
  Object.keys(labels).map((key) => [key, { label: labels[key as T], badge: colors[key as T] }])
) as Record<T, BadgeConfig>;

export const ROLE_COLORS: Record<Role, BadgeVariant> = {
  ADMIN: "danger", MANAGER: "warning", STAFF: "info", TENANT: "success",
};
export const USER_STATUS_COLORS: Record<UserStatus, BadgeVariant> = {
  ACTIVE: "success", INACTIVE: "gray", BANNED: "danger",
};
export const BUILDING_STATUS_COLORS: Record<BuildingStatus, BadgeVariant> = {
  ACTIVE: "success", INACTIVE: "gray",
};
export const APARTMENT_STATUS_COLORS: Record<ApartmentStatus, BadgeVariant> = {
  AVAILABLE: "success", RESERVED: "warning", RENTED: "info", MAINTENANCE: "warning", VACATING_SOON: "warning",
};
export const CONTRACT_STATUS_COLORS: Record<ContractStatus, BadgeVariant> = {
  ACTIVE: "success", ENDED: "gray",
};
export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, BadgeVariant> = {
  PAID: "success", UNPAID: "warning", OVERDUE: "danger",
};
export const INVOICE_TYPE_COLORS: Record<InvoiceType, BadgeVariant> = {
  DEPOSIT: "info", FIRST_RENT: "info", MONTHLY: "default", MAINTENANCE: "warning", FINAL_SETTLEMENT: "gray",
};
export const PAYMENT_METHOD_COLORS: Record<PaymentMethod, BadgeVariant> = {
  E_WALLET: "success", CASH: "gray",
};
export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, BadgeVariant> = {
  PENDING: "warning", SUCCESS: "success", FAILED: "danger",
};
export const RESERVATION_STATUS_COLORS: Record<ReservationStatus, BadgeVariant> = {
  ACTIVE: "warning", CONVERTED: "success", FORFEITED: "danger", CANCELLED: "gray",
};
export const PRIORITY_COLORS: Record<Priority, BadgeVariant> = {
  LOW: "gray", MEDIUM: "warning", HIGH: "danger",
};
export const REQUEST_STATUS_COLORS: Record<RequestStatus, BadgeVariant> = {
  PENDING: "warning", PROCESSING: "info", DONE: "success", CANCELLED: "gray", NEEDS_RESCHEDULE: "danger",
};
export const SCHEDULE_STATUS_COLORS: Record<ScheduleStatus, BadgeVariant> = {
  PENDING: "warning", CONFIRMED: "info", CANCELLED: "gray",
};
export const ATTENDANCE_STATUS_COLORS: Record<AttendanceStatus, BadgeVariant> = {
  NOT_YET: "gray", ATTENDED: "success", ABSENT: "danger",
};
export const CONTRACT_TERMINATION_TYPE_COLORS: Record<ContractTerminationType, BadgeVariant> = {
  TENANT_REQUEST: "info", OVERDUE: "danger",
};
export const CONTRACT_TERMINATION_STATUS_COLORS: Record<ContractTerminationStatus, BadgeVariant> = {
  PENDING: "warning", APPROVED: "info", REJECTED: "danger", INSPECTION: "warning", SETTLING: "info", COMPLETED: "success", CANCELLED: "gray",
};
export const DEPOSIT_POLICY_COLORS: Record<DepositPolicy, BadgeVariant> = {
  REFUNDABLE: "success", FORFEITED: "danger",
};
export const SETTLEMENT_FINANCIAL_STATUS_COLORS: Record<SettlementFinancialStatus, BadgeVariant> = {
  PENDING: "warning", AWAITING_PAYMENT: "warning", PARTIALLY_PAID: "info", SETTLED: "success",
};

export const ROLE_CONFIG = createBadgeConfig(ROLE_LABELS, ROLE_COLORS);
export const USER_STATUS_CONFIG = createBadgeConfig(USER_STATUS_LABELS, USER_STATUS_COLORS);
export const BUILDING_STATUS_CONFIG = createBadgeConfig(BUILDING_STATUS_LABELS, BUILDING_STATUS_COLORS);
export const APARTMENT_STATUS_CONFIG = createBadgeConfig(APARTMENT_STATUS_LABELS, APARTMENT_STATUS_COLORS);
export const CONTRACT_STATUS_CONFIG = createBadgeConfig(CONTRACT_STATUS_LABELS, CONTRACT_STATUS_COLORS);
export const INVOICE_STATUS_CONFIG = createBadgeConfig(INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS);
export const INVOICE_TYPE_CONFIG = createBadgeConfig(INVOICE_TYPE_LABELS, INVOICE_TYPE_COLORS);
export const PAYMENT_METHOD_CONFIG = createBadgeConfig(PAYMENT_METHOD_LABELS, PAYMENT_METHOD_COLORS);
export const PAYMENT_STATUS_CONFIG = createBadgeConfig(PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS);
export const RESERVATION_STATUS_CONFIG = createBadgeConfig(RESERVATION_STATUS_LABELS, RESERVATION_STATUS_COLORS);
export const PRIORITY_CONFIG = createBadgeConfig(PRIORITY_LABELS, PRIORITY_COLORS);
export const REQUEST_STATUS_CONFIG = createBadgeConfig(REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS);
export const SCHEDULE_STATUS_CONFIG = createBadgeConfig(SCHEDULE_STATUS_LABELS, SCHEDULE_STATUS_COLORS);
export const ATTENDANCE_STATUS_CONFIG = createBadgeConfig(ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_COLORS);
export const CONTRACT_TERMINATION_TYPE_CONFIG = createBadgeConfig(CONTRACT_TERMINATION_TYPE_LABELS, CONTRACT_TERMINATION_TYPE_COLORS);
export const CONTRACT_TERMINATION_STATUS_CONFIG = createBadgeConfig(CONTRACT_TERMINATION_STATUS_LABELS, CONTRACT_TERMINATION_STATUS_COLORS);
export const DEPOSIT_POLICY_CONFIG = createBadgeConfig(DEPOSIT_POLICY_LABELS, DEPOSIT_POLICY_COLORS);
export const SETTLEMENT_FINANCIAL_STATUS_CONFIG = createBadgeConfig(SETTLEMENT_FINANCIAL_STATUS_LABELS, SETTLEMENT_FINANCIAL_STATUS_COLORS);
