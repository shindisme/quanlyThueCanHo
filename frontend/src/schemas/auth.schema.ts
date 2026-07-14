import { z } from 'zod';

export const loginSchema = z.object({
    username: z.string().min(1, { message: "Tên đăng nhập không được để trống" }),
    password: z.string().min(1, { message: "Mật khẩu không được để trống" }).min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" }),
});