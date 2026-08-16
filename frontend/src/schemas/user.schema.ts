import { z } from "zod";
import { ROLE_VALUES, USER_STATUS_VALUES } from "../constants/enums";
import { citizenIdSchema, optionalPhoneSchema } from "./common.schema";

export const createUserSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Tên tài khoản phải từ 3 ký tự trở lên" })
    .max(100, { message: "Tên tài khoản tối đa 100 ký tự" }),
  role: z.enum(ROLE_VALUES, { message: "Vai trò không hợp lệ" }),
});

export const updateUserSchema = z.object({
  username: z.string().min(3, { message: "Tên tài khoản phải từ 3 ký tự trở lên" }).optional(),
  full_name: z.string().min(1, { message: "Họ và tên không được để trống" }).optional(),
  role: z.enum(ROLE_VALUES, { message: "Vai trò không hợp lệ" }),
  status: z.enum(USER_STATUS_VALUES).optional(),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;
export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;

export const profileUpdateSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, { message: "Họ tên không được để trống" })
    .max(200, { message: "Họ tên tối đa 200 ký tự" }),
  phone: optionalPhoneSchema,
});

export const changePasswordSchema = z
  .object({
    oldPass: z.string().min(1, { message: "Vui lòng nhập mật khẩu hiện tại" }),
    newPass: z.string().min(6, { message: "Mật khẩu mới phải ít nhất 6 ký tự" }),
    confirmPass: z.string().min(1, { message: "Vui lòng xác nhận mật khẩu mới" }),
  })
  .refine((data) => data.newPass === data.confirmPass, {
    message: "Mật khẩu mới không khớp",
    path: ["confirmPass"],
  })
  .refine((data) => data.oldPass !== data.newPass, {
    message: "Mật khẩu mới phải khác mật khẩu hiện tại",
    path: ["newPass"],
  });

export const occupantSchema = z.object({
  name: z.string().min(1, { message: "Vui lòng nhập họ và tên" }),
  cccd: citizenIdSchema,
  dob: z.string().optional().nullable(),
  phone: optionalPhoneSchema,
});
