import { prisma } from "../config/database.js";
import { Prisma } from "@prisma/client";

const normalizePagination = (page = 1, limit = 10) => {
    const pageValue = Number.isFinite(page) ? Math.trunc(page) : 1;
    const limitValue = Number.isFinite(limit) ? Math.trunc(limit) : 10;
    const normalizedPage = Math.max(1, pageValue);
    const normalizedLimit = Math.min(1000, Math.max(1, limitValue));

    return {
        page: normalizedPage,
        limit: normalizedLimit,
        skip: (normalizedPage - 1) * normalizedLimit
    };
};

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

export const getTenants = async (page = 1, limit = 10, search?: string) => {
    const pagination = normalizePagination(page, limit);
    const whereClause: Prisma.TenantWhereInput = {};

    if (search?.trim()) {
        const keyword = search.trim();
        whereClause.OR = [
            { full_name: { contains: keyword, mode: "insensitive" } },
            { phone: { contains: keyword, mode: "insensitive" } },
            { email: { contains: keyword, mode: "insensitive" } },
            { citizen_id: { contains: keyword, mode: "insensitive" } }
        ];
    }

    const [tenants, total] = await prisma.$transaction([
        prisma.tenant.findMany({
            where: whereClause,
            skip: pagination.skip,
            take: pagination.limit,
            orderBy: { created_at: "desc" },
            select: {
                id: true,
                user_id: true,
                full_name: true,
                phone: true,
                email: true,
                citizen_id: true,
                address: true,
                date_of_birth: true,
                is_verified: true,
                created_at: true,
                user: {
                    select: {
                        id: true,
                        username: true,
                        role: true,
                        status: true,
                        created_at: true
                    }
                }
            }
        }),
        prisma.tenant.count({ where: whereClause })
    ]);

    return {
        data: tenants,
        pagination: {
            total,
            page: pagination.page,
            limit: pagination.limit,
            totalPages: Math.ceil(total / pagination.limit)
        }
    };
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
