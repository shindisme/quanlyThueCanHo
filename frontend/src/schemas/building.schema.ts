import { z } from "zod";

export const buildingSchema = z.object({
  branch_name: z
    .string()
    .min(1, { message: "Chi nhánh tòa nhà không được để trống" })
    .max(200, { message: "Chi nhánh tòa nhà tối đa 200 ký tự" }),
  address: z
    .string()
    .min(1, { message: "Địa chỉ tòa nhà không được để trống" })
    .max(500, { message: "Địa chỉ tòa nhà tối đa 500 ký tự" }),
  total_floors: z
    .number({ message: "Số tầng phải là số" })
    .int({ message: "Số tầng phải là số nguyên" })
    .positive({ message: "Số tầng phải từ 1 trở lên" }),
  staff_id: z.number().nullable().optional(),
  description: z.string().max(5000, { message: "Mô tả tối đa 5000 ký tự" }).optional().nullable(),
});

export type BuildingFormValues = z.infer<typeof buildingSchema>;

export const DEFAULT_BUILDING_FORM: BuildingFormValues = {
  branch_name: "",
  address: "",
  total_floors: 1,
  staff_id: null,
  description: "",
};

export const buildingModifySchema = buildingSchema.extend({
  status: z.string().optional(),
  remove_thumbnail: z.boolean().optional(),
});

export type BuildingModifyFormValues = z.infer<typeof buildingModifySchema>;
