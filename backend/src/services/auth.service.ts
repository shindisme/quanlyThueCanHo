import {
    UserStatus,
    type Role
} from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../config/database.js";
import { AppError } from "../errors/app-error.js";

const DUMMY_PASSWORD_HASH =
    "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

const invalidCredentialsError = () => new AppError(
    401,
    "INVALID_CREDENTIALS",
    "Invalid username or password"
);

export const createAccountByAdminService = async (data: {
    username: string;
    role: Role;
}) => {
    const password_hash = await bcrypt.hash("123456", 10);

    return prisma.user.create({
        data: {
            username: data.username,
            role: data.role,
            password_hash,
            status: UserStatus.ACTIVE
        }
    });
};

export const deleteUserService = async (id: number) => {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
        throw new Error("User does not exist");
    }

    return prisma.user.delete({
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

    return users.map((user) => ({
        id: user.id,
        username: user.username,
        role: user.role,
        status: user.status,
        created_at: user.created_at,
        managed_building: user.staff?.building
            ? {
                id: user.staff.building.id,
                branch_name: user.staff.building.branch_name,
                address_new: user.staff.building.address_new
            }
            : null
    }));
};

export const loginService = async (username: string, password: string) => {
    const user = await prisma.user.findUnique({
        where: { username }
    });
    const isMatch = await bcrypt.compare(
        password,
        user?.password_hash ?? DUMMY_PASSWORD_HASH
    );

    if (!user || !isMatch) {
        throw invalidCredentialsError();
    }

    if (user.status !== UserStatus.ACTIVE) {
        throw new AppError(
            403,
            "ACCOUNT_DISABLED",
            "This account is disabled"
        );
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new AppError(
            500,
            "JWT_NOT_CONFIGURED",
            "JWT authentication is not configured"
        );
    }

    const token = jwt.sign(
        {},
        secret,
        {
            algorithm: "HS256",
            expiresIn: "24h",
            subject: String(user.id)
        }
    );

    return { token, role: user.role };
};

export const updateUserService = async (
    id: number,
    data: {
        username?: string;
        role?: Role;
    }
) => {
    const updateData: {
        username?: string;
        role?: Role;
    } = {};

    if (data.username) {
        updateData.username = data.username;
    }

    if (data.role) {
        updateData.role = data.role;
    }

    return prisma.user.update({
        where: { id },
        data: updateData
    });
};

export const resetPasswordByAdminService = async (id: number) => {
    const password_hash = await bcrypt.hash("123456", 10);

    return prisma.user.update({
        where: { id },
        data: { password_hash }
    });
};

export const changePasswordService = async (
    id: number,
    oldPass: string,
    newPass: string
) => {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
        throw new AppError(404, "NOT_FOUND", "User was not found");
    }

    const isMatch = await bcrypt.compare(oldPass, user.password_hash);

    if (!isMatch) {
        throw new AppError(
            401,
            "INVALID_PASSWORD",
            "Current password is incorrect"
        );
    }

    const password_hash = await bcrypt.hash(newPass, 10);

    return prisma.user.update({
        where: { id },
        data: { password_hash }
    });
};
