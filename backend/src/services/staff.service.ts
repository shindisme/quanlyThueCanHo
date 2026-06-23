import { prisma } from "../config/database.js";

export const getAllStaffService = async () => {
    return await prisma.staff.findMany({ include: { user: true } });
};

export const getStaffByIdService = async (id: number) => {
    return await prisma.staff.findUnique({ where: { id }, include: { user: true } });
};
export const createStaffService = async (data: any) => {
    return await prisma.staff.create({
        data: {
            user_id: data.user_id,
            building_id: data.building_id,
            full_name: data.full_name,
            phone: data.phone,
            position: data.position
        }
    });
};

export const updateStaffService = async (id: number, data: any) => {
    return await prisma.staff.update({
        where: { id },
        data: {
            building_id: data.building_id,
            full_name: data.full_name,
            phone: data.phone,
            position: data.position
        }
    });
};

export const deleteStaffService = async (id: number) => {
    const existing = await prisma.staff.findUnique({ where: { id } });
    if (!existing) throw new Error("Nhân viên không tồn tại trong hệ thống");

    return await prisma.staff.delete({ where: { id } });
};