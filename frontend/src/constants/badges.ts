import type { BadgeVariant } from "../components/ui/Badge";
import type {
  UserStatus,
  ApartmentStatus,
  ContractStatus,
  InvoiceStatus,
  PaymentStatus,
  Priority,
  RequestStatus,
} from "./enums";
import {
  USER_STATUS_LABELS,
  APARTMENT_STATUS_LABELS,
  CONTRACT_STATUS_LABELS,
  INVOICE_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  PRIORITY_LABELS,
  REQUEST_STATUS_LABELS,
} from "./labels";

export const APARTMENT_STATUS_COLORS: Record<ApartmentStatus, BadgeVariant> = {
  AVAILABLE: "success",
  RESERVED: "warning",
  RENTED: "info",
  MAINTENANCE: "warning",
  SOON_AVAILABLE: "warning",
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

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, BadgeVariant> = {
  PENDING: "warning",
  SUCCESS: "success",
  FAILED: "danger",
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

export const USER_STATUS_CONFIG: Record<UserStatus, { label: string; badge: BadgeVariant }> = {
  ACTIVE: { label: USER_STATUS_LABELS.ACTIVE, badge: "success" },
  INACTIVE: { label: USER_STATUS_LABELS.INACTIVE, badge: "gray" },
  BANNED: { label: USER_STATUS_LABELS.BANNED, badge: "danger" },
} as const;

export const APARTMENT_STATUS_CONFIG: Record<ApartmentStatus, { label: string; badge: BadgeVariant }> = {
  AVAILABLE: { label: APARTMENT_STATUS_LABELS.AVAILABLE, badge: APARTMENT_STATUS_COLORS.AVAILABLE },
  RESERVED: { label: APARTMENT_STATUS_LABELS.RESERVED, badge: APARTMENT_STATUS_COLORS.RESERVED },
  RENTED: { label: APARTMENT_STATUS_LABELS.RENTED, badge: APARTMENT_STATUS_COLORS.RENTED },
  MAINTENANCE: { label: APARTMENT_STATUS_LABELS.MAINTENANCE, badge: APARTMENT_STATUS_COLORS.MAINTENANCE },
  SOON_AVAILABLE: { label: APARTMENT_STATUS_LABELS.SOON_AVAILABLE, badge: APARTMENT_STATUS_COLORS.SOON_AVAILABLE },
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

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; badge: BadgeVariant }> = {
  PENDING: { label: PAYMENT_STATUS_LABELS.PENDING, badge: PAYMENT_STATUS_COLORS.PENDING },
  SUCCESS: { label: PAYMENT_STATUS_LABELS.SUCCESS, badge: PAYMENT_STATUS_COLORS.SUCCESS },
  FAILED: { label: PAYMENT_STATUS_LABELS.FAILED, badge: PAYMENT_STATUS_COLORS.FAILED },
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
