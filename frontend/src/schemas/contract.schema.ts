import { z } from "zod"

export const contractSchema = z.object({
  is_new_tenant: z.boolean(),

  tenant_id: z.number().nullable().optional(),

  new_tenant_name: z.string().optional(),
  new_tenant_cccd: z.string().optional(),
  new_tenant_dob: z.string().optional(),
  new_tenant_email: z.string().optional(),
  new_tenant_phone: z.string().optional(),
  new_tenant_address: z.string().optional(),

  building_id: z.number({ message: "Chi nhánh không được để trống" }),
  floor: z.number({ message: "Tầng không được để trống" }),
  apartment_id: z.number({ message: "Căn hộ không được để trống" }),
  start_date: z.string().min(1, { message: "Ngày bắt đầu không được để trống" }),
  end_date: z.string().min(1, { message: "Ngày kết thúc không được để trống" }),
  actual_occupants: z.number({ message: "Số người ở phải là một số" }).min(1, { message: "Số người ở phải ít nhất là 1" }),
  monthly_rent: z.number().min(0, { message: "Tiền thuê phải lớn hơn hoặc bằng 0" }),
  deposit_amount: z.number().min(0, { message: "Tiền cọc phải lớn hơn hoặc bằng 0" }),
}).superRefine((data, ctx) => {
  if (data.is_new_tenant) {
    if (!data.new_tenant_name || data.new_tenant_name.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["new_tenant_name"],
        message: "Họ tên người thuê mới không được để trống",
      })
    }
    if (!data.new_tenant_cccd || data.new_tenant_cccd.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["new_tenant_cccd"],
        message: "Số CCCD người thuê mới không được để trống",
      })
    }
  } else {
    if (!data.tenant_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tenant_id"],
        message: "Vui lòng chọn người thuê",
      })
    }
  }
})

export type ContractFormValues = z.infer<typeof contractSchema>
