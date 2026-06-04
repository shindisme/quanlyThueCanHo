import { prisma } from "../config/database.js";
import { Prisma } from "@prisma/client";

export const createBuildingService = async (data: {
    name: string;
    address: string;
    description?: string;
    status?: number;
    totalFloors: number;
    branchName: string;
}) => {
    return await prisma.building.create({
        data,
    });
};

export const getAllBuildingsService = async (filters: {
    search?: string;
    branchName?: string;
    page?: number;
    limit?: number;
}) => {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const whereClause: Prisma.BuildingWhereInput = {};

    if (filters.search) {
        whereClause.OR = [
            { name: { contains: filters.search } },
            { address: { contains: filters.search } },
        ];
    }

    if (filters.branchName) {
        whereClause.branchName = filters.branchName;
    }

    const [buildings, total] = await prisma.$transaction([
        prisma.building.findMany({
            where: whereClause,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                _count: {
                    select: { apartments: true },
                },
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

export const getBuildingByIdService = async (id: number) => {
    return await prisma.building.findUnique({
        where: { id },
        include: { apartments: true },
    });
};

export const updateBuildingService = async (
    id: number,
    data: {
        name?: string;
        address?: string;
        description?: string;
        status?: number;
        totalFloors?: number;
        branchName?: string;
    }
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