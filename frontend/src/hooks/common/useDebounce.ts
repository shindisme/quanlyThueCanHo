import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Đặt hẹn giờ cập nhật giá trị
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      // Xóa hẹn giờ cũ nếu giá trị tiếp tục thay đổi trước khi hết giờ (ví dụ đang gõ chữ tiếp)
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
