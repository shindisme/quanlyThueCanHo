import { prisma } from "../config/database.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const createAccountByAdminService = async (data: { username: string, role: any }) => {
    const tempPassword = "123456";
    const password_hash = await bcrypt.hash(tempPassword, 10);

    return await prisma.user.create({
        data: {
            username: data.username,
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
            tenant: true,
            staff: {
                include: {
                    building: true
                }
            }
        }
    });
    return users.map(user => ({
        id: user.id,
        username: user.username,
        role: user.role,
        status: user.status,
        created_at: user.created_at,
        managed_building: user.staff?.building ? {
            id: user.staff.building.id,
            branch_name: user.staff.building.branch_name,
            address_new: user.staff.building.address_new
        } : null
    }));
};

export const loginService = async (username: string, password: string) => {
    const user = await prisma.user.findFirst({
        where: { username: username }
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

export const updateUserService = async (id: number, data: { username?: string, role?: any }) => {
    const updateData: any = {};
    if (data.username) {
        updateData.username = data.username;
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