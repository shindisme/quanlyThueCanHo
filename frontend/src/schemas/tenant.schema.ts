import { z } from "zod";

export const tenantSchema = z.object({
  full_name: z.string().min(1, { message: "Vui lòng nhập họ tên" }),
  citizen_id: z
    .string()
    .min(1, { message: "Vui lòng nhập số CCCD" })
    .regex(/^\d{12}$/, { message: "CCCD không hợp lệ (phải gồm đúng 12 chữ số)" }),
  date_of_birth: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  email: z
    .string()
    .email({ message: "Email không hợp lệ" })
    .optional()
    .or(z.literal(""))
    .nullable(),
  phone: z
    .string()
    .regex(/^(0[123456789]\d{8})$/, { message: "Số điện thoại không hợp lệ" })
    .optional()
    .or(z.literal(""))
    .nullable(),
});
