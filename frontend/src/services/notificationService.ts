import api from "../lib/api";
import type { Notification } from "../types";

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

export interface NotificationPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getAllNotifications(params?: NotificationFilters): Promise<{ data: Notification[]; pagination?: NotificationPagination }> {
  interface NotificationsResponse {
    data: Notification[];
    meta?: {
      pagination?: NotificationPagination;
    };
    pagination?: NotificationPagination;
  }
  const res = await api.get<NotificationsResponse>("/notifications", { params });
  const rawData = res.data.data || [];
  const translatedData = rawData.map(translateNotification);
  return {
    data: translatedData,
    pagination: res.data.meta?.pagination || res.data.pagination
  };
}

export interface SendBuildingNotificationPayload {
  building_id: number;
  title: string;
  content: string;
  type?: string;
  apartment_ids?: number[];
  tenant_ids?: number[];
}

export async function sendBuildingNotification(payload: SendBuildingNotificationPayload): Promise<{ success: boolean; message: string }> {
  const res = await api.post<{ success: boolean; message: string }>("/notifications/building", payload);
  return res.data;
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

export async function sendInvoiceNotifications(payload: SendInvoiceNotificationsPayload): Promise<{ success: boolean; message: string }> {
  const res = await api.post<{ success: boolean; message: string }>("/notifications/invoices", payload);
  return res.data;
}

export async function markNotificationRead(id: number, is_read: boolean = true): Promise<Notification> {
  const res = await api.patch<{ data: Notification }>(`/notifications/${id}/read`, { is_read });
  return translateNotification(res.data.data);
}

export async function markAllNotificationsRead(): Promise<{ success: boolean; message: string }> {
  const res = await api.patch<{ success: boolean; message: string }>("/notifications/read-all");
  return res.data;
}

export async function deleteNotification(id: number): Promise<{ success: boolean; message: string }> {
  const res = await api.delete<{ success: boolean; message: string }>(`/notifications/${id}`);
  return res.data;
}
