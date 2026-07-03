import { z } from "zod";

export const utilitySchema = z.object({
  apartment_id: z
    .number({ message: "Vui lòng chọn căn hộ" })
    .min(1, { message: "Vui lòng chọn căn hộ" }),
  month: z
    .number({ message: "Vui lòng chọn tháng" })
    .min(1)
    .max(12),
  year: z
    .number({ message: "Vui lòng chọn năm" })
    .min(2000, { message: "Năm phải từ năm 2000 trở lên" })
    .max(3000, { message: "Năm tối đa là năm 3000" }),
  electric_old: z.number().min(0),
  electric_new: z
    .number({ message: "Chỉ số điện mới phải là số" })
    .min(0, { message: "Chỉ số điện mới không được nhỏ hơn 0" }),
  water_old: z.number().min(0),
  water_new: z
    .number({ message: "Chỉ số nước mới phải là số" })
    .min(0, { message: "Chỉ số nước mới không được nhỏ hơn 0" }),
}).refine((data) => data.electric_new >= data.electric_old, {
  message: "Chỉ số điện mới không được nhỏ hơn chỉ số cũ",
  path: ["electric_new"],
}).refine((data) => data.water_new >= data.water_old, {
  message: "Chỉ số nước mới không được nhỏ hơn chỉ số cũ",
  path: ["water_new"],
});

export type UtilityFormValues = z.infer<typeof utilitySchema>;
