import { format, formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

export function formatDate(date: string | Date): string {
  if (!date) return "-";
  try {
    return format(new Date(date), "dd/MM/yyyy");
  } catch {
    return "-";
  }
}
export function formatDateTime(date: string | Date): string {
  if (!date) return "-";
  try {
    return format(new Date(date), "dd/MM/yyyy HH:mm");
  } catch {
    return "-";
  }
}

// Định dạng thời gian tương đối
export function formatRelativeTime(date: string | Date): string {
  if (!date) return "-";
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: vi });
  } catch {
    return "-";
  }
}
