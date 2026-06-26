import { z } from "zod";

export const apartmentSchema = z.object({
  room_number: z.string().min(1, { message: "Vui lòng nhập số phòng" }),
  building_id: z.number({ message: "Vui lòng chọn chi nhánh" }).min(1, { message: "Vui lòng chọn chi nhánh" }),
  floor: z.number().min(1, { message: "Tầng phải từ 1 trở lên" }),
  area: z.number().min(0, { message: "Diện tích không được nhỏ hơn 0" }),
  bedrooms: z.number().min(0),
  bathrooms: z.number().min(0),
  rental_price: z.number().min(0, { message: "Giá thuê không được nhỏ hơn 0" }),
  description: z.string().optional(),
  status: z.string(),
});
