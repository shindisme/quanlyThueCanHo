import { prisma } from "../config/database.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const createAccountByAdminService = async (data: { email: string, role: any, phone?: string }) => {
    const tempPassword = "123456";
    const password_hash = await bcrypt.hash(tempPassword, 10);

    return await prisma.user.create({
        data: {
            username: data.email,
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
    const users = await prisma.user.findMany({
        include: {
            tenant: true
        }
    });
    return users.map(user => ({
        id: user.id,
        email: user.username,
        phone: user.tenant?.phone || null,
        role: user.role,
        status: user.status,
        created_at: user.created_at
    }));
};

export const loginService = async (email: string, password: string) => {
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { username: email },
                { username: email.split("@")[0] }
            ]
        }
    });
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
    const updateData: any = {};
    if (data.email) {
        updateData.username = data.email;
    }
    if (data.role) {
        updateData.role = data.role;
    }
    
    return await prisma.user.update({
        where: { id },
        data: updateData
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