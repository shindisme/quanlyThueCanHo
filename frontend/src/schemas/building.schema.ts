import { z } from "zod"

export const buildingSchema = z.object({
  branch_name: z
    .string()
    .min(1, { message: "Chi nhánh tòa nhà không được để trống" })
    .max(200, { message: "Chi nhánh tòa nhà tối đa 200 ký tự" }),
  address_old: z
    .string()
    .min(1, { message: "Địa chỉ cũ không được để trống" })
    .max(500, { message: "Địa chỉ cũ tối đa 500 ký tự" }),
  address_new: z
    .string()
    .min(1, { message: "Địa chỉ mới không được để trống" })
    .max(500, { message: "Địa chỉ mới tối đa 500 ký tự" }),
  total_floors: z
    .number({ message: "Tầng phải là số" })
    .int({ message: "Tầng phải là số" })
    .positive({ message: "Tầng phải từ 1 trở lên" }),
  staff_id: z.number().nullable().optional(),
  description: z.string().max(5000, { message: "Mô tả tối đa 5000 ký tự" }).optional().nullable(),
})

export type BuildingFormValues = z.infer<typeof buildingSchema>

