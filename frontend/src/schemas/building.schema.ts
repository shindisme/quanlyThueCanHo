import { z } from "zod"

export const buildingSchema = z.object({
  branch_name: z.string().min(1, { message: "Tên chi nhánh/tòa nhà không được để trống" }),
  address_old: z.string().min(1, { message: "Địa chỉ cũ không được để trống" }),
  address_new: z.string().min(1, { message: "Địa chỉ mới không được để trống" }),
  total_floors: z.number({ message: "Số tầng phải là một số" }).min(0, { message: "Số tầng không được nhỏ hơn 0" }),
  staff_id: z.number().nullable().optional(),
  description: z.string().optional(),
})

export type BuildingFormValues = z.infer<typeof buildingSchema>
