import { prisma } from "../config/database.js";
export const createApartmentService = async (data) => {
    return await prisma.apartment.create({ data });
};
export const getAllApartmentsService = async (filters) => {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 10));
    const skip = (page - 1) * limit;
    const whereClause = {};
    if (filters.building_id) {
        whereClause.building_id = filters.building_id;
    }
    if (filters.search) {
        whereClause.room_number = { contains: filters.search };
    }
    if (filters.status) {
        const statusList = Array.isArray(filters.status) ? filters.status : [filters.status];
        whereClause.status = {
            in: statusList
        };
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
export const getApartmentByIdService = async (id) => {
    return await prisma.apartment.findUnique({
        where: { id },
        include: { building: true },
    });
};
export const updateApartmentService = async (id, data) => {
    return await prisma.apartment.update({
        where: { id },
        data,
    });
};
export const deleteApartmentService = async (id) => {
    return await prisma.apartment.delete({
        where: { id },
    });
};
