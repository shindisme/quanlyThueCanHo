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

export function formatDate(date: string | Date): string {
  return format(new Date(date), "dd/MM/yyyy");
}

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
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + "Tỉ";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "Tr.";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toString();
}

// Loại bỏ dấu tiếng Việt và chuyển thành chữ thường (lowercase) để tìm kiếm nhanh
export function removeVietnameseTones(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase();
}

export function formatApartmentDisplay(
  roomNumber: string,
  floor: number,
  role?: string,
  branchName?: string
): string {
  const cleanRoom = roomNumber.replace(/^P\.?/i, "").trim();
  const floorStr = String(floor);
  const baseName =
    cleanRoom.length >= floorStr.length + 2 && cleanRoom.startsWith(floorStr)
      ? `P.${cleanRoom}`
      : `P.${floorStr}${cleanRoom}`;

  if (role === "ADMIN" && branchName) {
    return `${baseName} - ${branchName}`;
  }
  return baseName;
}
