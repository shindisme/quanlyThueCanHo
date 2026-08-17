export function formatDate(dateStr?: string | Date | null): string {
  if (!dateStr) return "-";
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
export function formatVietnamDate(dateStr?: string | Date | null): string {
  if (!dateStr) return "-";
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

export function formatDateTime(dateStr?: string | Date | null): string {
  if (!dateStr) return "-";
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateToISO(date?: Date | null): string {
  if (!date || isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString("vi-VN");
}

export function getDayOptions() {
  return Array.from({ length: 31 }, (_, idx) => ({
    value: String(idx + 1),
    label: `Ngày ${idx + 1}`,
  }));
}

export function getMonthOptions() {
  return Array.from({ length: 12 }, (_, idx) => ({
    value: String(idx + 1),
    label: `Tháng ${idx + 1}`,
  }));
}

export function getYearOptions(startYear = 2024) {
  const currentYear = new Date().getFullYear();
  const years: { value: string; label: string }[] = [];
  for (let y = startYear; y <= currentYear + 1; y++) {
    years.push({ value: String(y), label: `Năm ${y}` });
  }
  return years.reverse();
}

export function getPreviousMonth(month: number, year: number): { previousMonth: number; previousYear: number } {
  const previousMonth = month === 1 ? 12 : month - 1;
  const previousYear = month === 1 ? year - 1 : year;
  return { previousMonth, previousYear };
}
