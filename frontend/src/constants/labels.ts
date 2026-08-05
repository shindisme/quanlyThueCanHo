import type {
  UserStatus,
  BuildingStatus,
  ApartmentStatus,
  ContractStatus,
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
  Priority,
  RequestStatus,
  ScheduleStatus,
} from "./enums";

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: "Hoạt động",
  INACTIVE: "Không hoạt động",
  BANNED: "Bị khoá",
};

export const APARTMENT_STATUS_LABELS: Record<ApartmentStatus, string> = {
  AVAILABLE: "Còn trống",
  RESERVED: "Đã cọc",
  RENTED: "Đang thuê",
  MAINTENANCE: "Bảo trì",
  VACATING_SOON: "Sắp trống",
};

export const APARTMENT_STATUS_OPTIONS = [
  { value: "AVAILABLE", label: APARTMENT_STATUS_LABELS.AVAILABLE },
  { value: "RESERVED", label: APARTMENT_STATUS_LABELS.RESERVED },
  { value: "RENTED", label: APARTMENT_STATUS_LABELS.RENTED },
  { value: "VACATING_SOON", label: APARTMENT_STATUS_LABELS.VACATING_SOON },
  { value: "MAINTENANCE", label: APARTMENT_STATUS_LABELS.MAINTENANCE },
];

export const BUILDING_STATUS_LABELS: Record<BuildingStatus, string> = {
  ACTIVE: "Hoạt động",
  INACTIVE: "Ngưng hoạt động",
};

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  ACTIVE: "Hiệu lực",
  ENDED: "Đã kết thúc",
  FORCE_TERMINATED: "Đã thanh lý",
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
  BANK_TRANSFER: "Chuyển khoản ngân hàng",
  E_WALLET: "VNPay",
  CASH: "Tiền Mặt",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: "Thấp",
  MEDIUM: "Trung bình",
  HIGH: "Cao",
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  PENDING: "Mới gửi",
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
  ATTENDED: "Khách đã đến",
  NO_SHOW: "Vắng mặt",
};

