import type { BadgeVariant } from "../components/ui/Badge";
import type {
  Role,
  UserStatus,
  BuildingStatus,
  ApartmentStatus,
  ContractStatus,
  InvoiceStatus,
  InvoiceType,
  PaymentStatus,
  ReservationStatus,
  Priority,
  RequestStatus,
  ScheduleStatus,
  AttendanceStatus,
  ContractTerminationType,
  ContractTerminationStatus,
  DepositPolicy,
  SettlementFinancialStatus,
} from "./enums";
import {
  ROLE_LABELS,
  USER_STATUS_LABELS,
  BUILDING_STATUS_LABELS,
  APARTMENT_STATUS_LABELS,
  CONTRACT_STATUS_LABELS,
  INVOICE_STATUS_LABELS,
  INVOICE_TYPE_LABELS,
  PAYMENT_STATUS_LABELS,
  RESERVATION_STATUS_LABELS,
  PRIORITY_LABELS,
  REQUEST_STATUS_LABELS,
  SCHEDULE_STATUS_LABELS,
  ATTENDANCE_STATUS_LABELS,
  CONTRACT_TERMINATION_TYPE_LABELS,
  CONTRACT_TERMINATION_STATUS_LABELS,
  DEPOSIT_POLICY_LABELS,
  SETTLEMENT_FINANCIAL_STATUS_LABELS,
} from "./labels";

export const ROLE_COLORS: Record<Role, BadgeVariant> = {
  ADMIN: "danger",
  MANAGER: "warning",
  STAFF: "info",
  TENANT: "success",
};

export const BUILDING_STATUS_COLORS: Record<BuildingStatus, BadgeVariant> = {
  ACTIVE: "success",
  INACTIVE: "gray",
};

export const APARTMENT_STATUS_COLORS: Record<ApartmentStatus, BadgeVariant> = {
  AVAILABLE: "success",
  RESERVED: "warning",
  RENTED: "info",
  MAINTENANCE: "warning",
  VACATING_SOON: "warning",
};

export const CONTRACT_STATUS_COLORS: Record<ContractStatus, BadgeVariant> = {
  ACTIVE: "success",
  ENDED: "gray",
  FORCE_TERMINATED: "danger",
};

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, BadgeVariant> = {
  PAID: "success",
  UNPAID: "warning",
  OVERDUE: "danger",
};

export const INVOICE_TYPE_COLORS: Record<InvoiceType, BadgeVariant> = {
  DEPOSIT: "info",
  FIRST_RENT: "info",
  MONTHLY: "default",
  MAINTENANCE: "warning",
  FINAL_SETTLEMENT: "gray",
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, BadgeVariant> = {
  PENDING: "warning",
  SUCCESS: "success",
  FAILED: "danger",
};

export const RESERVATION_STATUS_COLORS: Record<ReservationStatus, BadgeVariant> = {
  ACTIVE: "warning",
  CONVERTED: "success",
  FORFEITED: "danger",
  CANCELLED: "gray",
};

export const PRIORITY_COLORS: Record<Priority, BadgeVariant> = {
  LOW: "gray",
  MEDIUM: "warning",
  HIGH: "danger",
};

export const REQUEST_STATUS_COLORS: Record<RequestStatus, BadgeVariant> = {
  PENDING: "warning",
  PROCESSING: "info",
  DONE: "success",
  CANCELLED: "gray",
  NEEDS_RESCHEDULE: "danger",
};

export const SCHEDULE_STATUS_COLORS: Record<ScheduleStatus, BadgeVariant> = {
  PENDING: "warning",
  CONFIRMED: "info",
  CANCELLED: "gray",
};

export const ATTENDANCE_STATUS_COLORS: Record<AttendanceStatus, BadgeVariant> = {
  NOT_YET: "gray",
  ATTENDED: "success",
  ABSENT: "danger",
};

export const CONTRACT_TERMINATION_TYPE_COLORS: Record<ContractTerminationType, BadgeVariant> = {
  TENANT_REQUEST: "info",
  OVERDUE: "danger",
};

export const CONTRACT_TERMINATION_STATUS_COLORS: Record<ContractTerminationStatus, BadgeVariant> = {
  PENDING: "warning",
  APPROVED: "info",
  REJECTED: "danger",
  INSPECTION: "warning",
  SETTLING: "info",
  COMPLETED: "success",
  CANCELLED: "gray",
};

export const DEPOSIT_POLICY_COLORS: Record<DepositPolicy, BadgeVariant> = {
  REFUNDABLE: "success",
  FORFEITED: "danger",
};

export const SETTLEMENT_FINANCIAL_STATUS_COLORS: Record<SettlementFinancialStatus, BadgeVariant> = {
  PENDING: "warning",
  AWAITING_PAYMENT: "warning",
  PARTIALLY_PAID: "info",
  SETTLED: "success",
};

export const ROLE_CONFIG: Record<Role, { label: string; badge: BadgeVariant }> = {
  ADMIN: { label: ROLE_LABELS.ADMIN, badge: ROLE_COLORS.ADMIN },
  MANAGER: { label: ROLE_LABELS.MANAGER, badge: ROLE_COLORS.MANAGER },
  STAFF: { label: ROLE_LABELS.STAFF, badge: ROLE_COLORS.STAFF },
  TENANT: { label: ROLE_LABELS.TENANT, badge: ROLE_COLORS.TENANT },
} as const;

export const USER_STATUS_CONFIG: Record<UserStatus, { label: string; badge: BadgeVariant }> = {
  ACTIVE: { label: USER_STATUS_LABELS.ACTIVE, badge: "success" },
  INACTIVE: { label: USER_STATUS_LABELS.INACTIVE, badge: "gray" },
  BANNED: { label: USER_STATUS_LABELS.BANNED, badge: "danger" },
} as const;

export const BUILDING_STATUS_CONFIG: Record<BuildingStatus, { label: string; badge: BadgeVariant }> = {
  ACTIVE: { label: BUILDING_STATUS_LABELS.ACTIVE, badge: BUILDING_STATUS_COLORS.ACTIVE },
  INACTIVE: { label: BUILDING_STATUS_LABELS.INACTIVE, badge: BUILDING_STATUS_COLORS.INACTIVE },
} as const;

export const APARTMENT_STATUS_CONFIG: Record<ApartmentStatus, { label: string; badge: BadgeVariant }> = {
  AVAILABLE: { label: APARTMENT_STATUS_LABELS.AVAILABLE, badge: APARTMENT_STATUS_COLORS.AVAILABLE },
  RESERVED: { label: APARTMENT_STATUS_LABELS.RESERVED, badge: APARTMENT_STATUS_COLORS.RESERVED },
  RENTED: { label: APARTMENT_STATUS_LABELS.RENTED, badge: APARTMENT_STATUS_COLORS.RENTED },
  MAINTENANCE: { label: APARTMENT_STATUS_LABELS.MAINTENANCE, badge: APARTMENT_STATUS_COLORS.MAINTENANCE },
  VACATING_SOON: { label: APARTMENT_STATUS_LABELS.VACATING_SOON, badge: APARTMENT_STATUS_COLORS.VACATING_SOON },
} as const;

export const CONTRACT_STATUS_CONFIG: Record<ContractStatus, { label: string; badge: BadgeVariant }> = {
  ACTIVE: { label: CONTRACT_STATUS_LABELS.ACTIVE, badge: CONTRACT_STATUS_COLORS.ACTIVE },
  ENDED: { label: CONTRACT_STATUS_LABELS.ENDED, badge: CONTRACT_STATUS_COLORS.ENDED },
  FORCE_TERMINATED: { label: CONTRACT_STATUS_LABELS.FORCE_TERMINATED, badge: CONTRACT_STATUS_COLORS.FORCE_TERMINATED },
} as const;

export const INVOICE_STATUS_CONFIG: Record<InvoiceStatus, { label: string; badge: BadgeVariant }> = {
  PAID: { label: INVOICE_STATUS_LABELS.PAID, badge: INVOICE_STATUS_COLORS.PAID },
  UNPAID: { label: INVOICE_STATUS_LABELS.UNPAID, badge: INVOICE_STATUS_COLORS.UNPAID },
  OVERDUE: { label: INVOICE_STATUS_LABELS.OVERDUE, badge: INVOICE_STATUS_COLORS.OVERDUE },
} as const;

export const INVOICE_TYPE_CONFIG: Record<InvoiceType, { label: string; badge: BadgeVariant }> = {
  DEPOSIT: { label: INVOICE_TYPE_LABELS.DEPOSIT, badge: INVOICE_TYPE_COLORS.DEPOSIT },
  FIRST_RENT: { label: INVOICE_TYPE_LABELS.FIRST_RENT, badge: INVOICE_TYPE_COLORS.FIRST_RENT },
  MONTHLY: { label: INVOICE_TYPE_LABELS.MONTHLY, badge: INVOICE_TYPE_COLORS.MONTHLY },
  MAINTENANCE: { label: INVOICE_TYPE_LABELS.MAINTENANCE, badge: INVOICE_TYPE_COLORS.MAINTENANCE },
  FINAL_SETTLEMENT: { label: INVOICE_TYPE_LABELS.FINAL_SETTLEMENT, badge: INVOICE_TYPE_COLORS.FINAL_SETTLEMENT },
} as const;

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; badge: BadgeVariant }> = {
  PENDING: { label: PAYMENT_STATUS_LABELS.PENDING, badge: PAYMENT_STATUS_COLORS.PENDING },
  SUCCESS: { label: PAYMENT_STATUS_LABELS.SUCCESS, badge: PAYMENT_STATUS_COLORS.SUCCESS },
  FAILED: { label: PAYMENT_STATUS_LABELS.FAILED, badge: PAYMENT_STATUS_COLORS.FAILED },
} as const;

export const RESERVATION_STATUS_CONFIG: Record<ReservationStatus, { label: string; badge: BadgeVariant }> = {
  ACTIVE: { label: RESERVATION_STATUS_LABELS.ACTIVE, badge: RESERVATION_STATUS_COLORS.ACTIVE },
  CONVERTED: { label: RESERVATION_STATUS_LABELS.CONVERTED, badge: RESERVATION_STATUS_COLORS.CONVERTED },
  FORFEITED: { label: RESERVATION_STATUS_LABELS.FORFEITED, badge: RESERVATION_STATUS_COLORS.FORFEITED },
  CANCELLED: { label: RESERVATION_STATUS_LABELS.CANCELLED, badge: RESERVATION_STATUS_COLORS.CANCELLED },
} as const;

export const PRIORITY_CONFIG: Record<Priority, { label: string; badge: BadgeVariant }> = {
  LOW: { label: PRIORITY_LABELS.LOW, badge: PRIORITY_COLORS.LOW },
  MEDIUM: { label: PRIORITY_LABELS.MEDIUM, badge: PRIORITY_COLORS.MEDIUM },
  HIGH: { label: PRIORITY_LABELS.HIGH, badge: PRIORITY_COLORS.HIGH },
} as const;


export const REQUEST_STATUS_CONFIG: Record<RequestStatus, { label: string; badge: BadgeVariant }> = {
  PENDING: { label: REQUEST_STATUS_LABELS.PENDING, badge: REQUEST_STATUS_COLORS.PENDING },
  PROCESSING: { label: REQUEST_STATUS_LABELS.PROCESSING, badge: REQUEST_STATUS_COLORS.PROCESSING },
  DONE: { label: REQUEST_STATUS_LABELS.DONE, badge: REQUEST_STATUS_COLORS.DONE },
  CANCELLED: { label: REQUEST_STATUS_LABELS.CANCELLED, badge: REQUEST_STATUS_COLORS.CANCELLED },
  NEEDS_RESCHEDULE: { label: REQUEST_STATUS_LABELS.NEEDS_RESCHEDULE, badge: REQUEST_STATUS_COLORS.NEEDS_RESCHEDULE },
} as const;


export const SCHEDULE_STATUS_CONFIG: Record<ScheduleStatus, { label: string; badge: BadgeVariant }> = {
  PENDING: { label: SCHEDULE_STATUS_LABELS.PENDING, badge: SCHEDULE_STATUS_COLORS.PENDING },
  CONFIRMED: { label: SCHEDULE_STATUS_LABELS.CONFIRMED, badge: SCHEDULE_STATUS_COLORS.CONFIRMED },
  CANCELLED: { label: SCHEDULE_STATUS_LABELS.CANCELLED, badge: SCHEDULE_STATUS_COLORS.CANCELLED },
} as const;

export const ATTENDANCE_STATUS_CONFIG: Record<AttendanceStatus, { label: string; badge: BadgeVariant }> = {
  NOT_YET: { label: ATTENDANCE_STATUS_LABELS.NOT_YET, badge: ATTENDANCE_STATUS_COLORS.NOT_YET },
  ATTENDED: { label: ATTENDANCE_STATUS_LABELS.ATTENDED, badge: ATTENDANCE_STATUS_COLORS.ATTENDED },
  ABSENT: { label: ATTENDANCE_STATUS_LABELS.ABSENT, badge: ATTENDANCE_STATUS_COLORS.ABSENT },
} as const;

export const CONTRACT_TERMINATION_TYPE_CONFIG: Record<ContractTerminationType, { label: string; badge: BadgeVariant }> = {
  TENANT_REQUEST: { label: CONTRACT_TERMINATION_TYPE_LABELS.TENANT_REQUEST, badge: CONTRACT_TERMINATION_TYPE_COLORS.TENANT_REQUEST },
  OVERDUE: { label: CONTRACT_TERMINATION_TYPE_LABELS.OVERDUE, badge: CONTRACT_TERMINATION_TYPE_COLORS.OVERDUE },
} as const;

export const CONTRACT_TERMINATION_STATUS_CONFIG: Record<ContractTerminationStatus, { label: string; badge: BadgeVariant }> = {
  PENDING: { label: CONTRACT_TERMINATION_STATUS_LABELS.PENDING, badge: CONTRACT_TERMINATION_STATUS_COLORS.PENDING },
  APPROVED: { label: CONTRACT_TERMINATION_STATUS_LABELS.APPROVED, badge: CONTRACT_TERMINATION_STATUS_COLORS.APPROVED },
  REJECTED: { label: CONTRACT_TERMINATION_STATUS_LABELS.REJECTED, badge: CONTRACT_TERMINATION_STATUS_COLORS.REJECTED },
  INSPECTION: { label: CONTRACT_TERMINATION_STATUS_LABELS.INSPECTION, badge: CONTRACT_TERMINATION_STATUS_COLORS.INSPECTION },
  SETTLING: { label: CONTRACT_TERMINATION_STATUS_LABELS.SETTLING, badge: CONTRACT_TERMINATION_STATUS_COLORS.SETTLING },
  COMPLETED: { label: CONTRACT_TERMINATION_STATUS_LABELS.COMPLETED, badge: CONTRACT_TERMINATION_STATUS_COLORS.COMPLETED },
  CANCELLED: { label: CONTRACT_TERMINATION_STATUS_LABELS.CANCELLED, badge: CONTRACT_TERMINATION_STATUS_COLORS.CANCELLED },
} as const;

export const DEPOSIT_POLICY_CONFIG: Record<DepositPolicy, { label: string; badge: BadgeVariant }> = {
  REFUNDABLE: { label: DEPOSIT_POLICY_LABELS.REFUNDABLE, badge: DEPOSIT_POLICY_COLORS.REFUNDABLE },
  FORFEITED: { label: DEPOSIT_POLICY_LABELS.FORFEITED, badge: DEPOSIT_POLICY_COLORS.FORFEITED },
} as const;

export const SETTLEMENT_FINANCIAL_STATUS_CONFIG: Record<SettlementFinancialStatus, { label: string; badge: BadgeVariant }> = {
  PENDING: { label: SETTLEMENT_FINANCIAL_STATUS_LABELS.PENDING, badge: SETTLEMENT_FINANCIAL_STATUS_COLORS.PENDING },
  AWAITING_PAYMENT: { label: SETTLEMENT_FINANCIAL_STATUS_LABELS.AWAITING_PAYMENT, badge: SETTLEMENT_FINANCIAL_STATUS_COLORS.AWAITING_PAYMENT },
  PARTIALLY_PAID: { label: SETTLEMENT_FINANCIAL_STATUS_LABELS.PARTIALLY_PAID, badge: SETTLEMENT_FINANCIAL_STATUS_COLORS.PARTIALLY_PAID },
  SETTLED: { label: SETTLEMENT_FINANCIAL_STATUS_LABELS.SETTLED, badge: SETTLEMENT_FINANCIAL_STATUS_COLORS.SETTLED },
} as const;
