import { z } from 'zod';

export const loginSchema = z.object({
    email: z.email("Email không hợp lệ"),
    password: z.string().min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" }),
});