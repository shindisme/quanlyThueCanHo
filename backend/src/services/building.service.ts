import { prisma } from "../config/database.js";
import { Prisma, BuildingStatus } from "@prisma/client";

export const createBuildingService = async (data: Prisma.BuildingCreateInput) => {
    return await prisma.building.create({
        data,
    });
};

export const getAllBuildingsService = async (filters: {
    search?: string;
    branch_name?: string;
    page?: number;
    limit?: number;
    staffId?: number;
}) => {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const whereClause: Prisma.BuildingWhereInput = {};

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

    if (filters.staffId) {
        whereClause.staff_id = { equals: filters.staffId };
    }

    const [buildings, total] = await prisma.$transaction([
        prisma.building.findMany({
            where: whereClause,
            skip,
            take: limit,
            orderBy: { created_at: "desc" },
            include: {
                _count: {
                    select: {
                        apartments: true
                    }
                },
                assigned_staff: {
                    select: {
                        id: true,
                        full_name: true,
                        phone: true,
                        user: {
                            select: {
                                username: true,
                                role: true
                            }
                        }
                    }
                },
                apartments: true
            }
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

export const getBuildingByIdService = async (id: number) => {
    return await prisma.building.findUnique({
        where: { id },
        include: {
            apartments: true,
            assigned_staff: {
                select: {
                    id: true,
                    full_name: true,
                    phone: true,
                    user: {
                        select: {
                            username: true,
                            role: true
                        }
                    }
                }
            }
        },
    });
};

export const updateBuildingService = async (
    id: number,
    data: Prisma.BuildingUpdateInput
) => {
    return await prisma.building.update({
        where: { id },
        data,
    });
};

export const deleteBuildingService = async (id: number) => {
    return await prisma.building.delete({
        where: { id },
    });
};