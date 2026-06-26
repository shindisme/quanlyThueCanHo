import { z } from "zod";

export const tenantSchema = z.object({
  full_name: z.string().min(1, { message: "Vui lòng nhập họ tên" }),
  citizen_id: z.string().min(1, { message: "Vui lòng nhập số CCCD" }),
  date_of_birth: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
});
