import { z } from "zod";

export const staffSchema = z.object({
  fullName: z.string().min(1, { message: "Vui lòng nhập họ tên nhân viên" }),
  phone: z
    .string()
    .regex(/^(0[123456789]\d{8})$/, { message: "Số điện thoại không hợp lệ" })
    .optional()
    .or(z.literal(""))
    .nullable(),
  position: z.string().min(1, { message: "Vui lòng chọn chức vụ" }),
  buildingId: z.union([z.number(), z.string(), z.null()]).optional(),
});

export type StaffFormValues = z.infer<typeof staffSchema>;
