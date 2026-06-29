import {
    ApartmentStatus,
    Prisma,
    Role
} from "@prisma/client";
import { prisma } from "../config/database.js";
import { AppError } from "../errors/app-error.js";
import type {
    CreateApartmentRequest,
    UpdateApartmentRequest
} from "../schemas/apartment.schema.js";
import type { Actor } from "../types/auth.js";

const apartmentImageSelect = {
    id: true,
    apartment_id: true,
    image_url: true,
    is_thumbnail: true
} satisfies Prisma.ApartmentImageSelect;

const apartmentBuildingSelect = {
    id: true,
    branch_name: true,
    address_old: true,
    address_new: true,
    total_floors: true
} satisfies Prisma.BuildingSelect;

const apartmentSelect = {
    id: true,
    building_id: true,
    room_number: true,
    floor: true,
    area: true,
    bedrooms: true,
    bathrooms: true,
    rental_price: true,
    description: true,
    status: true,
    building: {
        select: apartmentBuildingSelect
    },
    images: {
        select: apartmentImageSelect,
        orderBy: [
            { is_thumbnail: "desc" },
            { id: "asc" }
        ]
    }
} satisfies Prisma.ApartmentSelect;

const notFound = () => new AppError(
    404,
    "NOT_FOUND",
    "Apartment was not found"
);

const getManagerBuildingId = (actor: Actor) => {
    if (actor.buildingId === undefined) {
        throw new AppError(
            403,
            "MANAGER_BUILDING_REQUIRED",
            "A current building assignment is required"
        );
    }

    return actor.buildingId;
};

export const assertApartmentCreateAccessService = (
    actor: Actor,
    requestedBuildingId?: number
) => {
    if (actor.role === Role.MANAGER) {
        getManagerBuildingId(actor);
        return;
    }

    if (requestedBuildingId === undefined) {
        throw new AppError(
            400,
            "VALIDATION_ERROR",
            "building_id is required for an Admin"
        );
    }
};

export const assertApartmentUpdateAccessService = async (
    id: number,
    actor: Actor
) => {
    if (actor.role !== Role.MANAGER) {
        return;
    }

    const buildingId = getManagerBuildingId(actor);
    const apartment = await prisma.apartment.findFirst({
        where: {
            id,
            building_id: buildingId
        },
        select: { id: true }
    });

    if (!apartment) {
        throw notFound();
    }
};

const addImages = async (
    apartmentId: number,
    imageUrls: string[]
) => {
    if (imageUrls.length === 0) {
        return;
    }

    const existingImages = await prisma.apartmentImage.findMany({
        where: { apartment_id: apartmentId },
        select: { id: true }
    });

    await prisma.apartmentImage.createMany({
        data: imageUrls.map((url, index) => ({
            apartment_id: apartmentId,
            image_url: url,
            is_thumbnail: existingImages.length === 0 && index === 0
        }))
    });
};

export const createApartmentWithImagesService = async (
    data: CreateApartmentRequest["body"],
    imageUrls: string[],
    actor: Actor
) => {
    assertApartmentCreateAccessService(actor, data.building_id);

    const buildingId = actor.role === Role.MANAGER
        ? getManagerBuildingId(actor)
        : data.building_id;

    // The assertion above narrows this at runtime for Admin requests.
    if (buildingId === undefined) {
        throw new AppError(400, "VALIDATION_ERROR", "building_id is required");
    }

    const {
        building_id: _clientBuildingId,
        ...apartmentData
    } = data;

    return prisma.$transaction(async (transaction) => {
        const created = await transaction.apartment.create({
            data: {
                ...apartmentData,
                building_id: buildingId
            }
        });

        if (imageUrls.length > 0) {
            await transaction.apartmentImage.createMany({
                data: imageUrls.map((url, index) => ({
                    apartment_id: created.id,
                    image_url: url,
                    is_thumbnail: index === 0
                }))
            });
        }

        return created;
    });
};

export const getAllApartmentsService = async (filters: {
    building_id?: number;
    search?: string;
    page?: number;
    limit?: number;
    status?: ApartmentStatus | ApartmentStatus[];
}) => {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const where: Prisma.ApartmentWhereInput = {};

    if (filters.building_id !== undefined) {
        where.building_id = filters.building_id;
    }

    if (filters.search) {
        where.room_number = { contains: filters.search };
    }

    if (filters.status) {
        where.status = {
            in: Array.isArray(filters.status)
                ? filters.status
                : [filters.status]
        };
    }

    const skip = (page - 1) * limit;
    const [apartments, total] = await prisma.$transaction([
        prisma.apartment.findMany({
            where,
            skip,
            take: limit,
            orderBy: { floor: "asc" },
            select: apartmentSelect
        }),
        prisma.apartment.count({ where })
    ]);

    return {
        data: apartments,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
};

export const getApartmentByIdService = async (id: number) => {
    return prisma.apartment.findUnique({
        where: { id },
        select: apartmentSelect
    });
};

export const updateApartmentService = async (
    id: number,
    data: UpdateApartmentRequest["body"],
    imageUrls: string[],
    actor: Actor
) => {
    if (actor.role === Role.MANAGER) {
        const buildingId = getManagerBuildingId(actor);
        const {
            building_id: _ignoredBuildingId,
            ...managerData
        } = data;
        const result = await prisma.apartment.updateMany({
            where: {
                id,
                building_id: buildingId
            },
            data: managerData
        });

        if (result.count === 0) {
            throw notFound();
        }

        await addImages(id, imageUrls);
        const updated = await prisma.apartment.findFirst({
            where: {
                id,
                building_id: buildingId
            },
            select: apartmentSelect
        });

        if (!updated) {
            throw notFound();
        }

        return updated;
    }

    const updated = await prisma.apartment.update({
        where: { id },
        data,
        select: apartmentSelect
    });

    await addImages(id, imageUrls);
    return updated;
};

export const deleteApartmentService = async (
    id: number,
    actor: Actor
) => {
    if (actor.role === Role.MANAGER) {
        const buildingId = getManagerBuildingId(actor);
        const result = await prisma.apartment.deleteMany({
            where: {
                id,
                building_id: buildingId
            }
        });

        if (result.count === 0) {
            throw notFound();
        }

        return;
    }

    await prisma.apartment.delete({
        where: { id }
    });
};
