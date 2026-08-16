import { z } from "zod";
import { citizenIdSchema, optionalEmailSchema, optionalPhoneSchema } from "./common.schema";

export const tenantSchema = z.object({
  full_name: z
    .string()
    .min(1, { message: "Vui lòng nhập họ tên" })
    .max(200, { message: "Họ tên tối đa 200 ký tự" }),
  citizen_id: citizenIdSchema,
  date_of_birth: z
    .string()
    .optional()
    .nullable(),
  address: z
    .string()
    .max(500, { message: "Địa chỉ tối đa 500 ký tự" })
    .optional()
    .nullable(),
  email: optionalEmailSchema,
  phone: optionalPhoneSchema,
});

export type TenantFormValues = z.infer<typeof tenantSchema>;
