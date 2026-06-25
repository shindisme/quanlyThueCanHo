import { prisma } from "../config/database.js";
import { Prisma } from "@prisma/client";

const normalizePagination = (page = 1, limit = 10) => {
    const pageValue = Number.isFinite(page) ? Math.trunc(page) : 1;
    const limitValue = Number.isFinite(limit) ? Math.trunc(limit) : 10;
    const normalizedPage = Math.max(1, pageValue);
    const normalizedLimit = Math.min(100, Math.max(1, limitValue));

    return {
        page: normalizedPage,
        limit: normalizedLimit,
        skip: (normalizedPage - 1) * normalizedLimit
    };
};

const staffSummarySelect = {
    id: true,
    full_name: true,
    phone: true,
    user: {
        select: {
            username: true,
            role: true
        }
    }
} satisfies Prisma.StaffSelect;

const buildingSummarySelect = {
    id: true,
    branch_name: true,
    address_old: true,
    address_new: true,
    description: true,
    status: true,
    total_floors: true,
    total_apartments: true,
    thumbnail_url: true,
    created_at: true,
    _count: {
        select: { apartments: true }
    },
    assigned_staff: {
        select: staffSummarySelect
    }
} satisfies Prisma.BuildingSelect;

export const createBuildingService = async (data: any, imageUrl: string) => {
    return await prisma.building.create({
        data: {
            ...data,
            thumbnail_url: imageUrl,
        }
    });
};

export const getAllBuildingsService = async (filters: {
    search?: string;
    branch_name?: string;
    page?: number;
    limit?: number;
    staffId?: number;
}) => {
    const pagination = normalizePagination(filters.page, filters.limit);

    const whereClause: Prisma.BuildingWhereInput = {};

    if (filters.search) {
        whereClause.OR = [
            { branch_name: { contains: filters.search, mode: 'insensitive' } },
            { address_old: { contains: filters.search, mode: 'insensitive' } },
            { address_new: { contains: filters.search, mode: 'insensitive' } },
        ];
    }

    if (filters.branch_name) {
        whereClause.branch_name = { equals: filters.branch_name };
    }

    if (filters.staffId) {
        whereClause.assigned_staff = {
            some: {
                id: filters.staffId
            }
        };
    }

    const [buildings, total] = await prisma.$transaction([
        prisma.building.findMany({
            where: whereClause,
            skip: pagination.skip,
            take: pagination.limit,
            orderBy: { created_at: "desc" },
            select: buildingSummarySelect
        }),
        prisma.building.count({ where: whereClause }),
    ]);

    return {
        data: buildings,
        pagination: {
            total,
            page: pagination.page,
            limit: pagination.limit,
            totalPages: Math.ceil(total / pagination.limit),
        },
    };
};

export const getBuildingByIdService = async (id: number) => {
    return await prisma.building.findUnique({
        where: { id },
        select: buildingSummarySelect,
    });
};

export const updateBuildingService = async (
    id: number,
    data: Prisma.BuildingUpdateInput
) => {
    return await prisma.building.update({
        where: { id },
        data,
        select: buildingSummarySelect,
    });
};

export const deleteBuildingService = async (id: number) => {
    return await prisma.building.delete({
        where: { id },
    });
};
