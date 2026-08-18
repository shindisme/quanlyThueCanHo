import type {
  Role,
  UserStatus,
  BuildingStatus,
  ApartmentStatus,
  ContractStatus,
  InvoiceStatus,
  InvoiceType,
  PaymentMethod,
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
  ATTENDANCE_STATUS_VALUES,
  BUILDING_STATUS_VALUES,
  CONTRACT_STATUS_VALUES,
  INVOICE_STATUS_VALUES,
  INVOICE_TYPE_VALUES,
  PRIORITY_VALUES,
  REQUEST_STATUS_VALUES,
  ROLE_VALUES,
  SCHEDULE_STATUS_VALUES,
  USER_STATUS_VALUES,
} from "./enums";

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Quản trị viên",
  MANAGER: "Quản lý",
  STAFF: "Nhân viên",
  TENANT: "Người thuê",
};

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: "Hoạt động",
  INACTIVE: "Không hoạt động",
  BANNED: "Bị khoá",
};

export const BUILDING_STATUS_LABELS: Record<BuildingStatus, string> = {
  ACTIVE: "Hoạt động",
  INACTIVE: "Ngưng hoạt động",
};

export const APARTMENT_STATUS_LABELS: Record<ApartmentStatus, string> = {
  AVAILABLE: "Còn trống",
  RESERVED: "Đã cọc",
  RENTED: "Đang thuê",
  MAINTENANCE: "Bảo trì",
  VACATING_SOON: "Sắp trống",
};

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  ACTIVE: "Hiệu lực",
  ENDED: "Đã kết thúc",
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  PAID: "Đã thanh toán",
  UNPAID: "Chưa thanh toán",
  OVERDUE: "Quá hạn",
};

export const INVOICE_TYPE_LABELS: Record<InvoiceType, string> = {
  DEPOSIT: "Tiền cọc",
  FIRST_RENT: "Tiền thuê kỳ đầu",
  MONTHLY: "Hàng tháng",
  MAINTENANCE: "Phí sửa chữa",
  FINAL_SETTLEMENT: "Thanh lý hợp đồng",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Chờ xử lý",
  SUCCESS: "Thành công",
  FAILED: "Thất bại",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  E_WALLET: "VNPay",
  CASH: "Tiền mặt",
};

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  ACTIVE: "Đang giữ chỗ",
  CONVERTED: "Đã chuyển hợp đồng",
  FORFEITED: "Mất cọc",
  CANCELLED: "Đã hủy",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: "Thấp",
  MEDIUM: "Trung bình",
  HIGH: "Cao",
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  PENDING: "Chờ tiếp nhận",
  PROCESSING: "Đang xử lý",
  DONE: "Hoàn thành",
  CANCELLED: "Đã huỷ",
  NEEDS_RESCHEDULE: "Hẹn lại lịch",
};

export const SCHEDULE_STATUS_LABELS: Record<ScheduleStatus, string> = {
  PENDING: "Chờ duyệt",
  CONFIRMED: "Đã duyệt",
  CANCELLED: "Đã huỷ",
};

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  NOT_YET: "Chưa đến",
  ATTENDED: "Đã đến",
  ABSENT: "Vắng mặt",
};

export const CONTRACT_TERMINATION_TYPE_LABELS: Record<ContractTerminationType, string> = {
  TENANT_REQUEST: "Khách yêu cầu trả phòng",
  OVERDUE: "Quản lý chủ động thanh lý",
};

export const CONTRACT_TERMINATION_STATUS_LABELS: Record<ContractTerminationStatus, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Đã từ chối",
  INSPECTION: "Đang kiểm tra phòng",
  SETTLING: "Đang quyết toán",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
};

export const DEPOSIT_POLICY_LABELS: Record<DepositPolicy, string> = {
  REFUNDABLE: "Đủ điều kiện hoàn cọc",
  FORFEITED: "Không hoàn cọc",
};

export const SETTLEMENT_FINANCIAL_STATUS_LABELS: Record<SettlementFinancialStatus, string> = {
  PENDING: "Chờ quyết toán",
  AWAITING_PAYMENT: "Chờ thanh toán",
  PARTIALLY_PAID: "Thanh toán một phần",
  SETTLED: "Đã tất toán",
};


export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
}

const createOptions = <T extends string>(
  labels: Record<T, string>,
  values: readonly T[]
): SelectOption<T>[] => values.map((value) => ({ value, label: labels[value] }));

export const APARTMENT_STATUS_OPTIONS: SelectOption<ApartmentStatus>[] = [
  { value: "AVAILABLE", label: APARTMENT_STATUS_LABELS.AVAILABLE },
  { value: "RESERVED", label: APARTMENT_STATUS_LABELS.RESERVED },
  { value: "RENTED", label: APARTMENT_STATUS_LABELS.RENTED },
  { value: "VACATING_SOON", label: APARTMENT_STATUS_LABELS.VACATING_SOON },
  { value: "MAINTENANCE", label: APARTMENT_STATUS_LABELS.MAINTENANCE },
];
export const APARTMENT_MANAGEABLE_STATUS_OPTIONS: SelectOption<ApartmentStatus>[] = [
  { value: "AVAILABLE", label: APARTMENT_STATUS_LABELS.AVAILABLE },
  { value: "MAINTENANCE", label: APARTMENT_STATUS_LABELS.MAINTENANCE },
];
export const PAYMENT_STATUS_OPTIONS: SelectOption<PaymentStatus>[] = [
  { value: "SUCCESS", label: PAYMENT_STATUS_LABELS.SUCCESS },
  { value: "PENDING", label: PAYMENT_STATUS_LABELS.PENDING },
  { value: "FAILED", label: PAYMENT_STATUS_LABELS.FAILED },
];
export const INVOICE_STATUS_OPTIONS = createOptions(INVOICE_STATUS_LABELS, INVOICE_STATUS_VALUES);

export const INVOICE_TYPE_OPTIONS = createOptions(INVOICE_TYPE_LABELS, INVOICE_TYPE_VALUES);
export const PAYMENT_METHOD_OPTIONS: SelectOption<PaymentMethod>[] = [
  { value: "E_WALLET", label: PAYMENT_METHOD_LABELS.E_WALLET },
  { value: "CASH", label: PAYMENT_METHOD_LABELS.CASH },
];

export const REQUEST_STATUS_OPTIONS = createOptions(REQUEST_STATUS_LABELS, REQUEST_STATUS_VALUES);

export const PRIORITY_OPTIONS = createOptions(PRIORITY_LABELS, PRIORITY_VALUES);

export const USER_ROLE_OPTIONS = createOptions(ROLE_LABELS, ROLE_VALUES);

export const USER_STATUS_OPTIONS = createOptions(USER_STATUS_LABELS, USER_STATUS_VALUES);

export const BUILDING_STATUS_OPTIONS = createOptions(BUILDING_STATUS_LABELS, BUILDING_STATUS_VALUES);

export const CONTRACT_STATUS_OPTIONS = createOptions(CONTRACT_STATUS_LABELS, CONTRACT_STATUS_VALUES);

export const SCHEDULE_STATUS_OPTIONS = createOptions(SCHEDULE_STATUS_LABELS, SCHEDULE_STATUS_VALUES);

export const ATTENDANCE_STATUS_OPTIONS = createOptions(ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_VALUES);
