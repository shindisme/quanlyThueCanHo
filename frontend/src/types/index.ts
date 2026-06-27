import type {
  Role,
  UserStatus,
  ApartmentStatus,
  ContractStatus,
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
  Priority,
  RequestStatus,
  ScheduleStatus,
  NotificationType,
  SenderType,
} from "../constants/enums";

// User 
export interface User {
  id: number;
  email: string;
  username?: string;
  phone: string | null;
  password_hash: string;
  role: Role;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  tenant_profile?: Tenant;
  managedBuildingId?: number;
}

// Tenant 
export interface Tenant {
  id: number;
  user_id: number | null;
  full_name: string;
  citizen_id: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  address: string | null;
  is_verified: boolean;
  created_at: string;

  user?: User;
  contracts?: RentalContract[];
  invoices?: Invoice[];
  maintenance_requests?: MaintenanceRequest[];
}

// Building 
export interface Building {
  id: number;
  name: string;
  address_old: string;
  address_new: string;
  description: string | null;
  status: string;
  total_floors: number;
  total_apartments: number;
  branch_name: string;
  thumbnail_url: string | null;
  created_at: string;
  apartments?: Apartment[];
  _count?: { apartments: number };
}

// Apartment 
export interface Apartment {
  id: number;
  building_id: number;
  room_number: string;
  floor: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  rental_price: number;
  description: string | null;
  status: ApartmentStatus;
  created_at: string;
  building?: Building;
  images?: ApartmentImage[];
  contracts?: RentalContract[];
}

// ApartmentImage 
export interface ApartmentImage {
  id: number;
  apartment_id: number;
  image_url: string;
  is_thumbnail: boolean;
  created_at?: string;
}

// RentalContract 
export interface RentalContract {
  id: number;
  apartment_id: number;
  tenant_id: number;
  start_date: string;
  end_date: string;
  deposit_amount: number;
  monthly_rent: number;
  status: ContractStatus;
  contractFile: string | null;
  signedAt: string;
  createdBy: number;
  created_at: string;
  actual_occupants?: number;
  max_occupants?: number;
  apartment?: Apartment;
  tenant?: Tenant;
  invoices?: Invoice[];
}

// Invoice 
export interface Invoice {
  id: number;
  invoice_code: string;
  contract_id: number;
  tenant_id: number;
  due_date: string;
  total_amount: number;
  status: InvoiceStatus;
  paid_at: string | null;
  created_at: string;
  // Lien ket
  contract?: RentalContract;
  tenant?: Tenant;
  items?: InvoiceItem[];
  payments?: Payment[];
}

// InvoiceItem
export interface InvoiceItem {
  id: number;
  invoice_id: number;
  item_name: string;
  quantity: number;
  unit_price: number;
  amount: number;
  description: string | null;
}

// Payment
export interface Payment {
  id: number;
  invoice_id: number;
  payment_method: PaymentMethod;
  transaction_code: string | null;
  amount: number;
  status: PaymentStatus;
  paid_at: string;
  invoice?: Invoice;
}

// UtilityReading 
export interface UtilityReading {
  id: number;
  apartment_id: number;
  month: number;
  year: number;
  electric_old: number;
  electric_new: number;
  water_old: number;
  water_new: number;
  recorded_by: number;
  created_at: string;
  apartment?: Apartment;
}

// MaintenanceRequest 
export interface MaintenanceRequest {
  id: number;
  tenant_id: number;
  apartment_id: number;
  title: string;
  description: string;
  image_url: string | null;
  priority: Priority;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
  tenant?: Tenant;
  apartment?: Apartment;
}

// ViewingSchedule 
export interface ViewingSchedule {
  id: number;
  apartment_id: number;
  guest_name: string;
  guest_phone: string;
  guest_email: string | null;
  schedule_time: string;
  status: ScheduleStatus;
  created_at: string;
  apartment?: Apartment;
}

// Notification
export interface Notification {
  id: number;
  user_id: number;
  title: string;
  content: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
}

// ChatSession
export interface ChatSession {
  id: number;
  user_id: number | null;
  created_at: string;
  messages?: ChatbotMessage[];
}

// ChatbotMessage
export interface ChatbotMessage {
  id: number;
  conversation_id: number;
  message: string;
  sender_type: SenderType;
  created_at: string;
}

// Du lieu KPI cho Dashboard
export interface DashboardKPI {
  totalBuildings: number;
  totalApartments: number;
  rentedApartments: number;
  availableApartments: number;
  totalTenants: number;
  monthlyRevenue: number;
  expiringContracts: number;
  pendingMaintenance: number;
}

// Du lieu bieu do doanh thu theo thang
export interface MonthlyRevenue {
  month: string;
  revenue: number;
}

// Phan trang
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Staff {
  id: number;
  user_id: number | null;
  building_id: number | null;
  full_name: string;
  phone: string | null;
  position: string;
  created_at: string;
  user?: User;
  building?: Building;
}
