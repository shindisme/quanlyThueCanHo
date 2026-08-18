import type { NotificationType } from "../constants/enums";

export interface NotificationApartment {
  id: number;
  room_number: string;
  floor: number;
  building?: {
    id: number;
    branch_name: string;
    address?: string;
  };
}

export interface NotificationRecipient {
  id: number;
  username: string;
  full_name?: string;
  role?: string;
  apartment?: NotificationApartment | null;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  content: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
  recipient_count?: number;
  recipients?: NotificationRecipient[];
  apartment?: NotificationApartment | null;
  apartments?: NotificationApartment[];
  building?: {
    id: number;
    branch_name: string;
  } | null;
  tenant?: {
    id: number;
    full_name: string;
    phone?: string | null;
    email?: string | null;
  } | null;
}

export interface NotificationFilters {
  type?: string;
  is_read?: boolean;
  user_id?: number;
  tenant_id?: number;
  building_id?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface SendBuildingNotificationPayload {
  building_id: number;
  title: string;
  content: string;
  type?: string;
  apartment_ids?: number[];
  tenant_ids?: number[];
}

export interface SendInvoiceNotificationsPayload {
  building_id?: number;
  invoice_ids?: number[];
  tenant_ids?: number[];
  month?: number;
  year?: number;
  status?: string;
  title?: string;
  content?: string;
}

