import { z } from "zod";
import { requiredPhoneSchema } from "./common.schema";

export const scheduleSchema = z.object({
  guest_name: z
    .string()
    .min(2, { message: "Họ tên phải từ 2 ký tự trở lên" })
    .max(200, { message: "Họ tên tối đa 200 ký tự" }),
  guest_phone: requiredPhoneSchema,
  guest_email: z
    .string()
    .min(1, { message: "Vui lòng nhập email" })
    .email({ message: "Email không hợp lệ" })
    .max(320, { message: "Email tối đa 320 ký tự" }),
  selectedDate: z.string().min(1, { message: "Vui lòng chọn ngày xem phòng" }),
  selectedTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { message: "Vui lòng chọn giờ xem phòng" }),
  note: z.string().optional(),
});
