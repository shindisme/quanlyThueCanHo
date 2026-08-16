import { z } from "zod";

export const scheduleSchema = z.object({
  guest_name: z
    .string()
    .min(2, { message: "Họ tên phải từ 2 ký tự trở lên" })
    .max(200, { message: "Họ tên tối đa 200 ký tự" }),
  guest_phone: z
    .string()
    .min(1, { message: "Vui lòng nhập số điện thoại" })
    .regex(/^(0[123456789]\d{8})$/, {
      message: "Số điện thoại không hợp lệ",
    }),
  guest_email: z
    .string()
    .min(1, { message: "Vui lòng nhập email" })
    .email({ message: "Email không hợp lệ" })
    .max(320, { message: "Email tối đa 320 ký tự" }),
  selectedDate: z.string().min(1, { message: "Vui lòng chọn ngày xem phòng" }),
  note: z.string().optional(),
});