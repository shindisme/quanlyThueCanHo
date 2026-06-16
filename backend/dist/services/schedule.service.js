import { prisma } from "../config/database.js";
const VALID_HOURS = [9, 11, 13, 15];
export const bookViewingService = async (data) => {
    const requestedDate = new Date(data.schedule_time);
    const hour = requestedDate.getHours();
    if (!VALID_HOURS.includes(hour)) {
        throw new Error("Khung giờ không hợp lệ.");
    }
    const existingBooking = await prisma.viewingSchedule.findFirst({
        where: {
            apartment_id: data.apartment_id,
            schedule_time: requestedDate,
            OR: [
                { status: 'CONFIRMED' },
                { temp_locked_until: { gt: new Date() } }
            ]
        }
    });
    if (existingBooking) {
        throw new Error("Khung giờ này đã có người đặt hoặc đang được giữ chỗ.");
    }
    return await prisma.viewingSchedule.create({
        data: {
            ...data,
            schedule_time: requestedDate,
            status: 'PENDING',
            temp_locked_until: new Date(Date.now() + 10 * 60000)
        }
    });
};
export const confirmScheduleService = async (id) => {
    const schedule = await prisma.viewingSchedule.findUnique({ where: { id } });
    if (!schedule)
        throw new Error("Lịch hẹn không tồn tại");
    if (schedule.status === 'CANCELLED') {
        throw new Error("Lịch này đã bị hủy, không thể xác nhận.");
    }
    return await prisma.viewingSchedule.update({
        where: { id },
        data: { status: 'CONFIRMED' }
    });
};
export const deleteScheduleService = async (id) => {
    return await prisma.viewingSchedule.delete({ where: { id } });
};
export const getSchedulesAdminService = async (date, guestName) => {
    const whereClause = {};
    if (date) {
        const startDate = new Date(date);
        const endDate = new Date(new Date(date).setDate(startDate.getDate() + 1));
        whereClause.schedule_time = { gte: startDate, lt: endDate };
    }
    if (guestName) {
        whereClause.guest_name = { contains: guestName, mode: 'insensitive' };
    }
    return await prisma.viewingSchedule.findMany({
        where: whereClause,
        include: { apartment: true }
    });
};
export const cancelScheduleService = async (id) => {
    const schedule = await prisma.viewingSchedule.findUnique({
        where: { id }
    });
    if (!schedule) {
        throw new Error("Lịch hẹn không tồn tại");
    }
    if (schedule.status === 'CONFIRMED') {
        throw new Error("Không thể hủy lịch đã được Admin xác nhận. Vui lòng liên hệ trực tiếp.");
    }
    const timeDifference = schedule.schedule_time.getTime() - Date.now();
    if (timeDifference < 86400000) {
        throw new Error("Không thể hủy lịch trong vòng 24 giờ trước giờ xem.");
    }
    return await prisma.viewingSchedule.update({
        where: { id },
        data: {
            status: 'CANCELLED',
            temp_locked_until: null
        }
    });
};
