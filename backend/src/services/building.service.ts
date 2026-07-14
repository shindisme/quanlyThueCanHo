import {
    Prisma,
    Role
} from "@prisma/client";
import { prisma } from "../config/database.js";
import { AppError } from "../errors/app-error.js";
import type {
    CreateBuildingRequest,
    UpdateBuildingRequest
} from "../schemas/building.schema.js";
import type { Actor } from "../types/auth.js";
import { getCurrentManagerAssignment } from "../utils/manager-scope.js";

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

const publicBuildingSelect = {
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
    }
} satisfies Prisma.BuildingSelect;

const privateBuildingSelect = {
    ...publicBuildingSelect,
    assigned_staff: {
        select: staffSummarySelect
    }
} satisfies Prisma.BuildingSelect;

const notFound = () => new AppError(
    404,
    "NOT_FOUND",
    "Tòa nhà không tồn tại"
);

const assertManagerBuildingTarget = (id: number, actor: Actor) => {
    const assignment = getCurrentManagerAssignment(actor);

    if (id !== assignment.buildingId) {
        throw notFound();
    }

    return assignment;
};

export const createBuildingService = async (
    data: CreateBuildingRequest["body"],
    imageUrl?: string
) => {
    const {
        staff_id,
        ...buildingData
    } = data;

    return prisma.building.create({
        data: {
            ...buildingData,
            thumbnail_url: imageUrl ?? null,
            assigned_staff: staff_id
                ? {
                    connect: { id: staff_id }
                }
                : undefined
        },
        select: privateBuildingSelect
    });
};

export const getAllBuildingsService = async (filters: {
    search?: string;
    branch_name?: string;
    page?: number;
    limit?: number;
    staffId?: number;
}) => {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const where: Prisma.BuildingWhereInput = {};

    if (filters.search) {
        where.OR = [
            {
                branch_name: {
                    contains: filters.search,
                    mode: "insensitive"
                }
            },
            {
                address_old: {
                    contains: filters.search,
                    mode: "insensitive"
                }
            },
            {
                address_new: {
                    contains: filters.search,
                    mode: "insensitive"
                }
            }
        ];
    }

    if (filters.branch_name) {
        where.branch_name = { equals: filters.branch_name };
    }

    if (filters.staffId !== undefined) {
        where.assigned_staff = {
            some: { id: filters.staffId }
        };
    }

    const skip = (page - 1) * limit;
    const [buildings, total] = await prisma.$transaction([
        prisma.building.findMany({
            where,
            skip,
            take: limit,
            orderBy: { created_at: "desc" },
            select: publicBuildingSelect
        }),
        prisma.building.count({ where })
    ]);

    return {
        data: buildings,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
};

export const getBuildingByIdService = async (id: number) => {
    return prisma.building.findUnique({
        where: { id },
        select: publicBuildingSelect
    });
};

export const assertBuildingUpdateAccessService = (
    id: number,
    data: UpdateBuildingRequest["body"],
    actor: Actor
) => {
    if (actor.role === Role.MANAGER) {
        assertManagerBuildingTarget(id, actor);

        if (data.staff_id !== undefined) {
            throw new AppError(
                403,
                "FORBIDDEN",
                "Quản lý không có quyền thay đổi phân công nhân viên của tòa nhà"
            );
        }
    }
};

export const updateBuildingService = async (
    id: number,
    data: UpdateBuildingRequest["body"],
    actor: Actor,
    imageUrl?: string
) => {
    assertBuildingUpdateAccessService(id, data, actor);

    const {
        staff_id,
        ...scalarData
    } = data;
    const updateData = {
        ...scalarData,
        ...(imageUrl === undefined
            ? {}
            : { thumbnail_url: imageUrl })
    };

    if (actor.role === Role.MANAGER) {
        const { buildingId, assignmentWhere } =
            assertManagerBuildingTarget(id, actor);

        return prisma.$transaction(async (transaction) => {
            const result = await transaction.building.updateMany({
                where: {
                    id: buildingId,
                    ...assignmentWhere
                },
                data: updateData
            });

            if (result.count === 0) {
                throw notFound();
            }

            const updated = await transaction.building.findUnique({
                where: { id: buildingId },
                select: privateBuildingSelect
            });

            if (!updated) {
                throw notFound();
            }

            return updated;
        });
    }

    const adminUpdateData: Prisma.BuildingUpdateInput = {
        ...updateData
    };

    if (staff_id !== undefined) {
        adminUpdateData.assigned_staff = {
            set: staff_id === null
                ? []
                : [{ id: staff_id }]
        };
    }

    return prisma.building.update({
        where: { id },
        data: adminUpdateData,
        select: privateBuildingSelect
    });
};

export const deleteBuildingService = async (id: number) => {
    return prisma.building.delete({
        where: { id }
    });
};
