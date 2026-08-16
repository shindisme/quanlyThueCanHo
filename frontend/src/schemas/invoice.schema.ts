import { z } from "zod";
import { citizenIdSchema, requiredPhoneSchema } from "./common.schema";

export const depositFormSchema = z.object({
  apartment_id: z.string().min(1, "Vui lòng chọn căn hộ đặt cọc"),
  full_name: z.string().trim().min(1, "Vui lòng nhập họ tên người thuê"),
  phone: requiredPhoneSchema,
  email: z.string().trim().min(1, "Vui lòng nhập địa chỉ email người thuê").email("Địa chỉ email không hợp lệ"),
  citizen_id: citizenIdSchema,
  move_in_date: z.string().min(1, "Vui lòng chọn ngày dọn vào").refine((val) => {
    const d = new Date(val);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return !isNaN(d.getTime()) && d >= today;
  }, "Ngày dọn vào không được ở trong quá khứ"),
  deposit_amount: z.number().gt(0, "Số tiền cọc phải lớn hơn 0"),
  payment_method: z.enum(["VNPAY", "CASH"]),
});

export const generateMonthlyInvoiceSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2020),
  building_id: z.number().min(1, "Vui lòng chọn tòa nhà"),
  due_date: z.string().min(1, "Vui lòng chọn hạn thanh toán"),
  management_fee_per_m2: z.number().min(0),
  electric_tier_prices: z.array(z.number()),
  water_tier_prices: z.array(z.number()),
  internet_fee: z.number().min(0),
  notify: z.boolean(),
});

export type DepositFormSchemaType = z.infer<typeof depositFormSchema>;
export type GenerateMonthlyInvoiceSchemaType = z.infer<typeof generateMonthlyInvoiceSchema>;
