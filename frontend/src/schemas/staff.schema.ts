import { z } from "zod";

export const staffSchema = z.object({
  fullName: z
    .string()
    .min(1, { message: "Vui lòng nhập họ tên nhân viên" })
    .max(200, { message: "Họ tên tối đa 200 ký tự" }),
  phone: z
    .string()
    .regex(/^(0[123456789]\d{8})$/, { message: "Số điện thoại không hợp lệ" })
    .optional()
    .or(z.literal(""))
    .nullable(),
  position: z.enum(["Quản lý", "Bảo vệ", "Vệ sinh", "Kỹ thuật", "Tiếp thị"], {
    message: "Vui lòng chọn chức vụ hợp lệ",
  }),
  buildingId: z.union([z.number(), z.string(), z.null()]).optional(),
});

export type StaffFormValues = z.infer<typeof staffSchema>;