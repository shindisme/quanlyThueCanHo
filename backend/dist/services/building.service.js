import { prisma } from "../config/database.js";
export const createBuildingService = async (data) => {
    return await prisma.building.create({
        data,
    });
};
export const getAllBuildingsService = async (filters) => {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;
    const whereClause = {};
    if (filters.search) {
        whereClause.OR = [
            { branch_name: { contains: filters.search } },
            { address_old: { contains: filters.search } },
            { address_new: { contains: filters.search } },
        ];
    }
    if (filters.branch_name) {
        whereClause.branch_name = { equals: filters.branch_name };
    }
    if (filters.managerId) {
        whereClause.manager_id = { equals: filters.managerId };
    }
    const [buildings, total] = await prisma.$transaction([
        prisma.building.findMany({
            where: whereClause,
            skip,
            take: limit,
            orderBy: { created_at: "desc" },
            include: {
                _count: {
                    select: { apartments: true },
                },
                manager: {
                    select: {
                        id: true,
                        username: true,
                        role: true
                    }
                }
            },
        }),
        prisma.building.count({ where: whereClause }),
    ]);
    return {
        data: buildings,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};
export const getBuildingByIdService = async (id) => {
    return await prisma.building.findUnique({
        where: { id },
        include: {
            apartments: true,
            manager: {
                select: {
                    id: true,
                    username: true,
                    role: true
                }
            }
        },
    });
};
export const updateBuildingService = async (id, data) => {
    return await prisma.building.update({
        where: { id },
        data,
    });
};
export const deleteBuildingService = async (id) => {
    return await prisma.building.delete({
        where: { id },
    });
};
