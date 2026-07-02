import { z } from "zod";

export const userCreateSchema = z.object({
  username: z.string().min(1, { message: "Vui lòng nhập tên tài khoản" }),
  role: z.string().min(1, { message: "Vui lòng chọn vai trò" }),
});

export const changePasswordSchema = z.object({
  oldPass: z.string().min(1, { message: "Vui lòng nhập mật khẩu hiện tại" }),
  newPass: z.string().min(6, { message: "Mật khẩu mới phải ít nhất 6 ký tự" }),
  confirmPass: z.string().min(1, { message: "Vui lòng xác nhận mật khẩu mới" }),
}).refine((data) => data.newPass === data.confirmPass, {
  message: "Mật khẩu mới không khớp",
  path: ["confirmPass"],
});

export const occupantSchema = z.object({
  name: z.string().min(1, { message: "Vui lòng nhập họ và tên" }),
  cccd: z
    .string()
    .min(1, { message: "Vui lòng nhập số CCCD" })
    .regex(/^\d{12}$/, { message: "CCCD không hợp lệ (phải gồm đúng 12 chữ số)" }),
  dob: z.string().optional().nullable(),
  phone: z
    .string()
    .regex(/^(0[123456789]\d{8})$/, { message: "Số điện thoại không hợp lệ" })
    .optional()
    .or(z.literal(""))
    .nullable(),
});
