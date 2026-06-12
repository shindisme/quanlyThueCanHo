import { format, formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

// Dinh dang tien VND: 5000000 => "5.000.000 VND"
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

// Dinh dang ngay: "15/06/2026"
export function formatDate(date: string | Date): string {
  return format(new Date(date), "dd/MM/yyyy");
}

// Dinh dang ngay gio: "15/06/2026 14:30"
export function formatDateTime(date: string | Date): string {
  return format(new Date(date), "dd/MM/yyyy HH:mm");
}

// Thoi gian tuong doi: "3 ngay truoc"
export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: vi });
}

// Dinh dang so: 14565 => "14.565"
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("vi-VN").format(num);
}

// Rut gon so lon: 1500000 => "1.5M"
export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + "B";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toString();
}
