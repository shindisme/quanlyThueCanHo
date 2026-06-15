import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().min(1, { message: "Tên tài khoản không được để trống" }),
    password: z.string().min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" }),
});