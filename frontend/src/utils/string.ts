// Loại bỏ dấu tiếng Việt
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
