// Lấy đuôi file
export function getFileExtension(filename: string): string {
  if (!filename) return "";
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
}

// Định dạng kích thước file thành KB MB GB
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Check file hợp lệ
export function isValidImageFile(
  file: File,
  maxSizeMB = 5
): { valid: boolean; error?: string } {
  const validExtensions = ["jpg", "jpeg", "png", "webp"];
  const ext = getFileExtension(file.name).toLowerCase();

  if (!validExtensions.includes(ext)) {
    return {
      valid: false,
      error: "Định dạng ảnh không hợp lệ (Chỉ hỗ trợ JPG, JPEG, PNG, WEBP)",
    };
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `Dung lượng ảnh vượt quá giới hạn cho phép (${maxSizeMB}MB)`,
    };
  }

  return { valid: true };
}

// Lấy ảnh đại diện/thumbnail của căn hộ
export function getApartmentThumbnail(apt: { images?: { is_thumbnail?: boolean; image_url: string }[] }): string {
  if (apt && apt.images && Array.isArray(apt.images) && apt.images.length > 0) {
    const thumb = apt.images.find((img) => img.is_thumbnail);
    if (thumb) return thumb.image_url;
    return apt.images[0].image_url;
  }
  return "";
}
