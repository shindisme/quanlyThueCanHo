import { z } from "zod";

export const scheduleSchema = z.object({
  guest_name: z.string().min(1, { message: "Vui lòng nhập họ tên" }),
  guest_phone: z.string().min(1, { message: "Vui lòng nhập số điện thoại" }),
  guest_email: z.string().min(1, { message: "Vui lòng nhập email" }),
  selectedDate: z.string().min(1, { message: "Vui lòng chọn ngày xem phòng" }),
  selectedSlot: z.string().min(1, { message: "Vui lòng chọn giờ xem phòng" }),
  note: z.string().optional(),
});
