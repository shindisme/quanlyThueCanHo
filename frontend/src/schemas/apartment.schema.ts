import { z } from "zod";
import { APARTMENT_STATUS_VALUES } from "../constants/enums";

export const apartmentSchema = z.object({
  room_number: z
    .string()
    .min(1, { message: "Vui lòng nhập số phòng" })
    .max(4, { message: "Số phòng tối đa 4 ký tự" }),
  building_id: z
    .number({ message: "Vui lòng chọn chi nhánh" })
    .min(1, { message: "Vui lòng chọn chi nhánh" }),
  floor: z
    .number()
    .int({ message: "Tầng phải là số" })
    .min(1, { message: "Tầng phải từ 1 trở lên" }),
  area: z
    .number({ message: "Diện tích phải là số" })
    .positive({ message: "Diện tích phải lớn hơn 0" }),
  bedrooms: z
    .number()
    .int({ message: "Số phòng ngủ phải là số" })
    .nonnegative({ message: "Số phòng ngủ không được nhỏ hơn 0" }),
  bathrooms: z
    .number()
    .int({ message: "Số phòng vệ sinh phải là số" })
    .positive({ message: "Số phòng vệ sinh phải từ 1 trở lên" }),
  rental_price: z
    .number({ message: "Giá thuê phải là số" })
    .positive({ message: "Giá thuê phải lớn hơn 0" })
    .max(1000000000000, { message: "Giá thuê tối đa 1.000 tỷ đồng" }),
  description: z
    .string()
    .max(5000, { message: "Mô tả tối đa 5000 ký tự" })
    .optional()
    .nullable(),
  status: z.enum(APARTMENT_STATUS_VALUES),
});

export type ApartmentFormValues = z.infer<typeof apartmentSchema>;

