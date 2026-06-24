import { prisma } from "../config/database.js";
import { Prisma } from "@prisma/client";

export const createTenant = async (data: any) => {
    const existing = await prisma.tenant.findUnique({
        where: { phone: data.phone }
    });
    
    if (existing) {
        throw new Error("Số điện thoại này đã tồn tại trong hệ thống.");
    }

    return await prisma.tenant.create({
        data: {
            full_name: data.full_name,
            phone: data.phone,
            email: data.email,
            citizen_id: data.citizen_id,
            address: data.address,
            date_of_birth: data.date_of_birth ? new Date(data.date_of_birth) : null,
            user_id: data.user_id ? Number(data.user_id) : null,
        },
    });
};

export const getTenants = async (page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    return await prisma.tenant.findMany({
        skip,
        take: limit,
        include: { user: true }
    });
};

export const updateTenant = async (id: number, data: Prisma.TenantUpdateInput) => {
    return await prisma.tenant.update({
        where: { id },
        data
    });
};

export const deleteTenant = async (id: number) => {
    return await prisma.tenant.delete({
        where: { id }
    });
};