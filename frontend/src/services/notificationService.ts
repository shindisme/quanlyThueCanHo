import api from "../lib/api";
import type { Notification, NotificationFilters, SendBuildingNotificationPayload, SendInvoiceNotificationsPayload, ApiPagination } from "../types";
export type { NotificationFilters, SendBuildingNotificationPayload, SendInvoiceNotificationsPayload };
import { fetchAllPages } from "./apiHelper";

const NOTIFICATION_API = "/notifications";

export async function getAll(params?: NotificationFilters): Promise<{ data: Notification[]; pagination?: ApiPagination }> {
  const res = await api.get<{ data: Notification[]; meta?: { pagination?: ApiPagination }; pagination?: ApiPagination }>(NOTIFICATION_API, { params });
  return {
    data: res.data.data || [],
    pagination: res.data.meta?.pagination || res.data.pagination
  };
}

export async function getAllPage(params?: Omit<NotificationFilters, "page" | "limit">): Promise<{ data: Notification[] }> {
  return fetchAllPages<Notification, NotificationFilters>(getAll, params);
}

export async function sendBuildingNotification(payload: SendBuildingNotificationPayload): Promise<{ success: boolean; message: string }> {
  const res = await api.post<{ success: boolean; message: string }>(`${NOTIFICATION_API}/building`, payload);
  return res.data;
}

export async function sendInvoiceNotifications(payload: SendInvoiceNotificationsPayload): Promise<{ success: boolean; message: string }> {
  const res = await api.post<{ success: boolean; message: string }>(`${NOTIFICATION_API}/invoices`, payload);
  return res.data;
}

export async function markNotificationRead(id: number, is_read: boolean = true): Promise<Notification> {
  const res = await api.patch<{ data: Notification }>(`${NOTIFICATION_API}/${id}/read`, { is_read });
  return res.data.data;
}

export async function markAllNotificationsRead(): Promise<{ success: boolean; message: string }> {
  const res = await api.patch<{ success: boolean; message: string }>(`${NOTIFICATION_API}/read-all`);
  return res.data;
}

export async function remove(id: number): Promise<{ success: boolean; message: string }> {
  const res = await api.delete<{ success: boolean; message: string }>(`${NOTIFICATION_API}/${id}`);
  return res.data;
}

export const notificationService = {
  getAll,
  getAllPage,
  sendBuildingNotification,
  sendInvoiceNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  remove,
};
