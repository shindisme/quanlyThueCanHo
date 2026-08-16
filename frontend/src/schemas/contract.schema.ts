import { z } from "zod"
import { CITIZEN_ID_REGEX, VIETNAM_PHONE_REGEX } from "./common.schema"

export const contractSchema = z.object({
  is_new_tenant: z.boolean(),

  tenant_id: z.number().nullable().optional(),

  new_tenant_name: z.string().optional(),
  new_tenant_cccd: z.string().optional(),
  new_tenant_dob: z.string().optional(),
  new_tenant_email: z.string().optional(),
  new_tenant_phone: z.string().optional(),
  new_tenant_address: z.string().optional(),

  building_id: z.number({ message: "Chi nhánh không được để trống" }).int().positive().optional(),
  floor: z.number({ message: "Tầng không được để trống" }).int().positive().optional(),
  apartment_id: z.number({ message: "Căn hộ không được để trống" }).int().positive().optional(),
  start_date: z.string().min(1, { message: "Ngày bắt đầu không được để trống" }),
  end_date: z.string().min(1, { message: "Ngày kết thúc không được để trống" }),
  actual_occupants: z.number({ message: "Số người ở phải là một số" }).min(1, { message: "Số người ở phải ít nhất là 1" }).optional(),
  monthly_rent: z.number().positive({ message: "Tiền thuê phải lớn hơn 0" }),
}).superRefine((data, ctx) => {
  const requiredNumberFields = [
    ["building_id", data.building_id, "Vui lòng chọn chi nhánh"],
    ["floor", data.floor, "Vui lòng chọn tầng"],
    ["apartment_id", data.apartment_id, "Vui lòng chọn căn hộ"],
    ["actual_occupants", data.actual_occupants, "Vui lòng nhập số người ở"],
  ] as const;

  requiredNumberFields.forEach(([field, value, message]) => {
    if (value === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message });
    }
  });

  if (data.start_date && data.end_date) {
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["start_date"],
        message: "Ngày bắt đầu không được nhỏ hơn ngày hiện tại",
      });
    }

    if (endDate <= startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["end_date"],
        message: "Ngày kết thúc phải sau ngày bắt đầu",
      });
    }

    if (endDate < today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["end_date"],
        message: "Ngày kết thúc không được nhỏ hơn ngày hiện tại",
      });
    }
  }

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
    } else if (!CITIZEN_ID_REGEX.test(data.new_tenant_cccd)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["new_tenant_cccd"],
        message: "Số CCCD không hợp lệ (phải gồm đúng 12 chữ số)",
      })
    }

    if (data.new_tenant_email && data.new_tenant_email.trim() !== "") {
      const emailRes = z.string().email().safeParse(data.new_tenant_email);
      if (!emailRes.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["new_tenant_email"],
          message: "Email không hợp lệ",
        })
      }
    }

    if (data.new_tenant_phone && data.new_tenant_phone.trim() !== "") {
      if (!VIETNAM_PHONE_REGEX.test(data.new_tenant_phone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["new_tenant_phone"],
          message: "Số điện thoại không hợp lệ",
        })
      }
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
