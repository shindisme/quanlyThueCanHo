import { prisma } from "../config/database.js";
import { Prisma } from "@prisma/client";

export const createApartmentWithImagesService = async (
    data: any,
    imageUrls: string[]
) => {
    return await prisma.$transaction(async (tx) => {
        const apartment = await tx.apartment.create({
            data: {
                building_id: Number(data.building_id),
                floor: Number(data.floor),
                room_number: data.room_number,
                area: Number(data.area),
                bedrooms: Number(data.bedrooms),
                bathrooms: Number(data.bathrooms),
                rental_price: Number(data.rental_price),
                description: data.description,
                status: data.status
            }
        });

        if (imageUrls.length > 0) {
            await tx.apartmentImage.createMany({
                data: imageUrls.map((url, index) => ({
                    apartment_id: apartment.id,
                    image_url: url,
                    is_thumbnail: index === 0
                }))
            });
        }
        return apartment;
    });
};

export const getAllApartmentsService = async (filters: {
    building_id?: number;
    search?: string;
    page?: number;
    limit?: number;
    status?: string | string[];
}) => {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 10));
    const skip = (page - 1) * limit;

    const whereClause: Prisma.ApartmentWhereInput = {};

    if (filters.building_id) {
        whereClause.building_id = filters.building_id;
    }

    if (filters.search) {
        whereClause.room_number = { contains: filters.search };
    }

    if (filters.status) {
        const statusList = Array.isArray(filters.status) ? filters.status : [filters.status];
        whereClause.status = {
            in: statusList as any
        };
    }

    const [apartments, total] = await prisma.$transaction([
        prisma.apartment.findMany({
            where: whereClause,
            skip,
            take: limit,
            orderBy: { floor: "asc" },
            include: {
                building: true,
                images: true
            },
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
        include: {
            building: true,
            images: true
        },
    });
};

export const updateApartmentService = async (id: number, data: any, imageUrls: string[] = []) => {
    return await prisma.$transaction(async (tx) => {
        const apartment = await tx.apartment.update({
            where: { id },
            data,
        });

        if (imageUrls.length > 0) {
            const existingImages = await tx.apartmentImage.findMany({
                where: { apartment_id: id }
            });

            await tx.apartmentImage.createMany({
                data: imageUrls.map((url, index) => ({
                    apartment_id: id,
                    image_url: url,
                    is_thumbnail: existingImages.length === 0 && index === 0
                }))
            });
        }

        return apartment;
    });
};

export const deleteApartmentService = async (id: number) => {
    return await prisma.apartment.delete({
        where: { id },
    });
};