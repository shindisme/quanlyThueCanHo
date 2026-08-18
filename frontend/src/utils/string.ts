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
  const cleanRoom = (roomNumber || "").replace(/^P\.?/i, "").trim();
  const floorStr = String(floor || 0);

  let roomPart = cleanRoom;
  if (cleanRoom.startsWith(floorStr) && cleanRoom.length > floorStr.length) {
    roomPart = cleanRoom.slice(floorStr.length);
  }

  const paddedRoom = roomPart.padStart(2, "0");
  const baseName = `P.${floorStr}${paddedRoom}`;

  let targetBranch = branchName;
  if (!targetBranch && role && !["ADMIN", "MANAGER", "STAFF", "TENANT", "GUEST"].includes(role)) {
    targetBranch = role;
  }

  if (targetBranch) {
    return `${baseName} - ${targetBranch}`;
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
  const match = fullName.match(/^(.*?)\s*(?:\(|\[)\s*(?:Ghi chú|Note):\s*(.*?)\s*(?:\)|\])$/i) ||
                fullName.match(/(.*?)\s*(?:\(|\[)\s*(?:Ghi chú|Note):\s*(.*?)\s*(?:\)|\])/i);
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

// Kiểm tra xem phòng trước đó đã được tạo ở cùng tầng chưa.
export function validateSequentialRoom(
  newRoomNumberStr: string,
  floor: number,
  existingApartmentsOnFloor: { room_number: string }[]
): { valid: boolean; error?: string } {
  const match = newRoomNumberStr.match(/(\d+)/);
  if (!match) {
    return { valid: true };
  }

  const rawNumStr = match[1];
  const num = parseInt(rawNumStr, 10);

  // Nếu là phòng 1 hoặc 0 không cần kiểm tra phòng trước đó
  if (num <= 1) {
    return { valid: true };
  }

  const prevNum = num - 1;
  const padLength = rawNumStr.length;
  const prevNumStrFormatted = String(prevNum).padStart(padLength, "0");

  const hasPreviousRoom = existingApartmentsOnFloor.some((apt) => {
    const aptMatch = apt.room_number.match(/(\d+)/);
    if (!aptMatch) return false;
    const aptNum = parseInt(aptMatch[1], 10);
    return aptNum === prevNum;
  });

  if (!hasPreviousRoom) {
    return {
      valid: false,
      error: `Phòng ${prevNumStrFormatted} ở tầng ${floor} chưa được tạo. Vui lòng tạo phòng theo thứ tự!`,
    };
  }

  return { valid: true };
}

export function extractInvoiceCode(notification: { title?: string; content?: string } | null): string | null {
  if (!notification) return null;
  const text = `${notification.title || ""} ${notification.content || ""}`;
  const match = text.match(/INV-[A-Z0-9_-]+/i);
  return match ? match[0].toUpperCase() : null;
}
