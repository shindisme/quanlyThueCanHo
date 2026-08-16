import { z } from "zod";
import { optionalPhoneSchema } from "./common.schema";
import { STAFF_POSITIONS } from "../constants/staff";

export const staffSchema = z.object({
  fullName: z
    .string()
    .min(1, { message: "Vui lòng nhập họ tên nhân viên" })
    .max(200, { message: "Họ tên tối đa 200 ký tự" }),
  phone: optionalPhoneSchema,
  position: z.enum(STAFF_POSITIONS, {
    message: "Vui lòng chọn chức vụ hợp lệ",
  }),
  buildingId: z.union([z.number(), z.string(), z.null()]).optional(),
});

export type StaffFormValues = z.infer<typeof staffSchema>;
