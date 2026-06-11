import { prisma } from "../config/database.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";


export const createAccountByAdminService = async (data: { email: string, role: any, phone?: string }) => {
    const tempPassword = "123456";
    const password_hash = await bcrypt.hash(tempPassword, 10);

    return await prisma.user.create({
        data: {
            email: data.email,
            phone: data.phone,
            role: data.role,
            password_hash,
            status: 'ACTIVE'
        }
    });
};
export const deleteUserService = async (id: number) => {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error("Người dùng không tồn tại");
    return await prisma.user.delete({
        where: { id }
    });
};
export const getAllUsersService = async () => {
    return await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            created_at: true
        }
    });
};
export const loginService = async (email: string, password: string) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("Tài khoản không tồn tại");

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) throw new Error("Sai mật khẩu");

    const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET as string,
        { expiresIn: "24h" }
    );

    return { token, role: user.role };
};

export const updateUserService = async (id: number, data: { email?: string, phone?: string, role?: any }) => {
    return await prisma.user.update({
        where: { id },
        data
    });
};

export const resetPasswordByAdminService = async (id: number) => {
    const password_hash = await bcrypt.hash("123456", 10);
    return await prisma.user.update({
        where: { id },
        data: { password_hash }
    });
};

export const changePasswordService = async (id: number, oldPass: string, newPass: string) => {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error("User không tồn tại");

    const isMatch = await bcrypt.compare(oldPass, user.password_hash);
    if (!isMatch) throw new Error("Mật khẩu cũ không đúng");

    const password_hash = await bcrypt.hash(newPass, 10);
    return await prisma.user.update({ where: { id }, data: { password_hash } });
};