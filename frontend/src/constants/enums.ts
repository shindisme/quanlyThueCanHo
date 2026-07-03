
export type Role = "ADMIN" | "MANAGER" | "STAFF" | "TENANT";

export type UserStatus = "ACTIVE" | "INACTIVE" | "BANNED";

export type BuildingStatus = "ACTIVE" | "INACTIVE";

export type ApartmentStatus = "AVAILABLE" | "RENTED" | "MAINTENANCE";

export type ContractStatus = "ACTIVE" | "ENDED" | "LIQUIDATED";

export type InvoiceStatus = "PAID" | "UNPAID" | "OVERDUE";

export type PaymentMethod = "BANK_TRANSFER" | "MOMO" | "VNPAY" | "CASH";

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";

export type Priority = "LOW" | "MEDIUM" | "HIGH";

export type RequestStatus = "PENDING" | "PROCESSING" | "NEEDS_RESCHEDULE" | "DONE" | "CANCELLED";

export type ScheduleStatus = "PENDING" | "CONFIRMED" | "DONE" | "CANCELLED";

export type NotificationType = "SYSTEM" | "INVOICE" | "MAINTENANCE" | "CHAT";

export type SenderType = "USER" | "CHATBOT";

// Map trang thai 
export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: "Hoạt động",
  INACTIVE: "Không hoạt động",
  BANNED: "Bị khoá",
};

export const APARTMENT_STATUS_LABELS: Record<ApartmentStatus, string> = {
  AVAILABLE: "Còn trống",
  RENTED: "Đang thuê",
  MAINTENANCE: "Bảo trì",
};

export const BUILDING_STATUS_LABELS: Record<BuildingStatus, string> = {
  ACTIVE: "Hoạt động",
  INACTIVE: "Ngưng hoạt động",
};

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  ACTIVE: "Hiệu lực",
  ENDED: "Đã kết thúc",
  LIQUIDATED: "Đã thanh lý",
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  PAID: "Đã thanh toán",
  UNPAID: "Chưa thanh toán",
  OVERDUE: "Quá hạn",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Chờ xử lý",
  SUCCESS: "Thành công",
  FAILED: "Thất bại",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  BANK_TRANSFER: "Chuyển khoản",
  MOMO: "MoMo",
  VNPAY: "VNPay",
  CASH: "Tiền mặt",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: "Thấp",
  MEDIUM: "Trung bình",
  HIGH: "Cao",
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  PENDING: "Mới tạo",
  PROCESSING: "Đang xử lý",
  DONE: "Hoàn thành",
  CANCELLED: "Đã huỷ",
  NEEDS_RESCHEDULE: "Hẹn lại lịch",
};

export const SCHEDULE_STATUS_LABELS: Record<ScheduleStatus, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  DONE: "Hoàn thành",
  CANCELLED: "Đã huỷ",
};

// Map trang thai Badge
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
  NEEDS_RESCHEDULE: "danger",
};
