import { prisma } from "../config/database.js";
import { Prisma } from "@prisma/client";

export const createApartmentService = async (data: {
    building_id: number;
    floor: number;
    room_number: string;
    area: number;
    bedrooms: number;
    bathrooms: number;
    rental_price: number;
    description?: string;
    status?: any;
}) => {
    return await prisma.apartment.create({ data });
};

export const getAllApartmentsService = async (filters: {
    building_id?: number;
    search?: string;
    page?: number;
    limit?: number;
}) => {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const whereClause: Prisma.ApartmentWhereInput = {};

    if (filters.building_id) {
        whereClause.building_id = filters.building_id;
    }

    if (filters.search) {
        whereClause.room_number = { contains: filters.search };
    }

    const [apartments, total] = await prisma.$transaction([
        prisma.apartment.findMany({
            where: whereClause,
            skip,
            take: limit,
            orderBy: { floor: "asc" },
            include: { building: true },
        }),
        prisma.apartment.count({ where: whereClause }),
    ]);

    return {
        data: apartments,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};

export const getApartmentByIdService = async (id: number) => {
    return await prisma.apartment.findUnique({
        where: { id },
        include: { building: true },
    });
};

export const updateApartmentService = async (id: number, data: any) => {
    return await prisma.apartment.update({
        where: { id },
        data,
    });
};

export const deleteApartmentService = async (id: number) => {
    return await prisma.apartment.delete({
        where: { id },
    });
};