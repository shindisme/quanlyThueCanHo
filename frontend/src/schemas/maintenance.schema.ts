import { z } from "zod";

export const createMaintenanceSchema = z.object({
  apartment_id: z.coerce
    .number()
    .int()
    .min(1, { message: "Vui lòng chọn căn hộ" }),
  title: z
    .string()
    .trim()
    .min(1, { message: "Tiêu đề không được để trống" })
    .max(200, { message: "Tiêu đề tối đa 200 ký tự" }),
  description: z
    .string()
    .trim()
    .min(1, { message: "Mô tả chi tiết không được để trống" })
    .max(10000, { message: "Mô tả tối đa 10000 ký tự" }),
  priority: z
    .enum(["LOW", "MEDIUM", "HIGH"])
    .default("MEDIUM"),
  image_url: z
    .string()
    .optional(),
});

export const confirmMaintenanceSchema = z.object({
  assigned_staff_id: z.coerce
    .number()
    .int()
    .min(1, { message: "Vui lòng chọn nhân viên kỹ thuật" }),
  scheduled_at: z
    .string()
    .min(1, { message: "Vui lòng chọn thời gian hẹn sửa chữa" }),
});

export const unableMaintenanceSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, { message: "Lý do không được để trống" })
    .max(2000, { message: "Lý do tối đa 2000 ký tự" }),
});
