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
import { getCurrentManagerAssignment } from "./manager-scope.js";

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

const concurrentModification = () => new AppError(
    409,
    "CONCURRENT_MODIFICATION",
    "Apartment changed during this operation"
);

const SERIALIZABLE_RETRY_LIMIT = 3;

const runSerializableTransaction = async <T>(
    operation: (transaction: Prisma.TransactionClient) => Promise<T>
) => {
    for (let attempt = 1; attempt <= SERIALIZABLE_RETRY_LIMIT; attempt++) {
        try {
            return await prisma.$transaction(operation, {
                isolationLevel:
                    Prisma.TransactionIsolationLevel.Serializable
            });
        } catch (error) {
            const isSerializationConflict =
                error instanceof Prisma.PrismaClientKnownRequestError
                && error.code === "P2034";

            if (!isSerializationConflict) {
                throw error;
            }

            if (attempt === SERIALIZABLE_RETRY_LIMIT) {
                throw concurrentModification();
            }
        }
    }

    throw new Error("Serializable transaction retry exhausted");
};

export const assertApartmentCreateAccessService = (
    actor: Actor,
    requestedBuildingId?: number
) => {
    if (actor.role === Role.MANAGER) {
        getCurrentManagerAssignment(actor);
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

    const {
        buildingId,
        assignmentWhere
    } = getCurrentManagerAssignment(actor);
    const apartment = await prisma.apartment.findFirst({
        where: {
            id,
            building_id: buildingId,
            building: assignmentWhere
        },
        select: { id: true }
    });

    if (!apartment) {
        throw notFound();
    }
};

export const createApartmentWithImagesService = async (
    data: CreateApartmentRequest["body"],
    imageUrls: string[],
    actor: Actor
) => {
    assertApartmentCreateAccessService(actor, data.building_id);

    const managerAssignment = actor.role === Role.MANAGER
        ? getCurrentManagerAssignment(actor)
        : undefined;
    const buildingId = managerAssignment?.buildingId
        ?? data.building_id;

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
            data: managerAssignment
                ? {
                    ...apartmentData,
                    building: {
                        connect: managerAssignment.buildingWhere
                    }
                }
                : {
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
    const {
        building_id: requestedBuildingId,
        ...adminData
    } = data;
    let where: Prisma.ApartmentWhereUniqueInput = { id };
    let updateData: Prisma.ApartmentUpdateInput = {
        ...adminData,
        ...(requestedBuildingId === undefined
            ? {}
            : {
                building: {
                    connect: { id: requestedBuildingId }
                }
            })
    };

    if (actor.role === Role.MANAGER) {
        const {
            buildingId,
            assignmentWhere
        } = getCurrentManagerAssignment(actor);
        where = {
            id,
            building_id: buildingId,
            building: assignmentWhere
        };
        updateData = adminData;
    }

    if (imageUrls.length === 0) {
        return prisma.apartment.update({
            where,
            data: updateData,
            select: apartmentSelect
        });
    }

    return runSerializableTransaction(async (transaction) => {
        const existingImageCount =
            await transaction.apartmentImage.count({
                where: { apartment_id: id }
            });

        return transaction.apartment.update({
            where,
            data: {
                ...updateData,
                images: {
                    create: imageUrls.map((url, index) => ({
                        image_url: url,
                        is_thumbnail:
                            existingImageCount === 0 && index === 0
                    }))
                }
            },
            select: apartmentSelect
        });
    });
};

export const deleteApartmentService = async (
    id: number,
    actor: Actor
) => {
    if (actor.role === Role.MANAGER) {
        const {
            buildingId,
            assignmentWhere
        } = getCurrentManagerAssignment(actor);
        const result = await prisma.apartment.deleteMany({
            where: {
                id,
                building_id: buildingId,
                building: assignmentWhere
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
