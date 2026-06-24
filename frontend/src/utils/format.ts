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

export function maskPhone(phone: string): string {
  if (!phone) return "-";
  const trimmed = phone.trim();
  if (trimmed.length < 6) return trimmed;
  const first = trimmed.slice(0, 3);
  const last = trimmed.slice(-3);
  const masked = "*".repeat(trimmed.length - 6);
  return `${first}${masked}${last}`;
}

export function maskCCCD(cccd: string): string {
  if (!cccd) return "-";
  const trimmed = cccd.trim();
  if (trimmed.length < 6) return trimmed;
  const first = trimmed.slice(0, 3);
  const last = trimmed.slice(-3);
  const masked = "*".repeat(trimmed.length - 6);
  return `${first}${masked}${last}`;
}

export function numberToVietnameseWords(num: number): string {
  if (num === 0) return "không";
  const units = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
  
  function readThreeDigits(n: number, showZeroHundred: boolean): string {
    let hundred = Math.floor(n / 100);
    let ten = Math.floor((n % 100) / 10);
    let unit = n % 10;
    let res = "";
    
    if (hundred > 0 || showZeroHundred) {
      res += units[hundred] + " trăm ";
    }
    
    if (ten > 0) {
      if (ten === 1) res += "mười ";
      else res += units[ten] + " ";
    } else if (hundred > 0 && unit > 0) {
      res += "lẻ ";
    }
    
    if (unit > 0) {
      if (unit === 1 && ten > 1) res += "mốt";
      else if (unit === 5 && ten > 0) res += "lăm";
      else res += units[unit];
    }
    return res.trim();
  }

  const groups = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];
  let temp = num;
  let parts = [];
  while (temp > 0) {
    parts.push(temp % 1000);
    temp = Math.floor(temp / 1000);
  }
  
  let result = "";
  for (let i = parts.length - 1; i >= 0; i--) {
    let text = readThreeDigits(parts[i], i < parts.length - 1 && parts[i] > 0);
    if (text !== "") {
      result += text + " " + groups[i] + " ";
    }
  }
  
  return result.trim().replace(/\s+/g, " ");
}

export function parseGuestName(fullName: string): { name: string; note: string } {
  if (!fullName) return { name: "", note: "" };
  const match = fullName.match(/(.*?)\s*\[Ghi chú:\s*(.*?)\]/i);
  if (match) {
    return {
      name: match[1].trim(),
      note: match[2].trim(),
    };
  }
  return {
    name: fullName.trim(),
    note: "",
  };
}
