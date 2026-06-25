import { ScheduleStatus } from "@prisma/client";
import { prisma } from "../config/database.js";
import { sendViewingScheduleConfirmationEmail } from "./mail.service.js";

const VALID_HOURS = [9, 11, 13, 15];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEMP_LOCK_DURATION_MS = 10 * 60000;

const findBlockingSchedule = (
    apartmentId: number,
    scheduleTime: Date,
    excludeId?: number
) => prisma.viewingSchedule.findFirst({
    where: {
        apartment_id: apartmentId,
        schedule_time: scheduleTime,
        ...(excludeId ? { id: { not: excludeId } } : {}),
        OR: [
            { status: ScheduleStatus.CONFIRMED },
            {
                status: ScheduleStatus.PENDING,
                temp_locked_until: { gt: new Date() }
            }
        ]
    }
});

const getApartmentLabel = (apartment: {
    room_number: string;
    floor: number;
    building?: { branch_name: string } | null;
}) => {
    const roomLabel = `Phòng ${apartment.room_number}, tầng ${apartment.floor}`;
    return apartment.building?.branch_name ? `${roomLabel}, ${apartment.building.branch_name}` : roomLabel;
};

export const bookViewingService = async (data: {
    apartment_id: number;
    guest_name: string;
    guest_phone: string;
    guest_email?: string;
    schedule_time: string;
}) => {
    const guestEmail = data.guest_email?.trim();
    if (!guestEmail) {
        throw new Error("Vui lòng nhập email.");
    }

    if (!EMAIL_PATTERN.test(guestEmail)) {
        throw new Error("Email không hợp lệ.");
    }

    const requestedDate = new Date(data.schedule_time);
    if (Number.isNaN(requestedDate.getTime())) {
        throw new Error("Thời gian đặt lịch không hợp lệ.");
    }

    const hour = requestedDate.getHours();
    if (!VALID_HOURS.includes(hour)) {
        throw new Error("Khung giờ không hợp lệ.");
    }

    const apartment = await prisma.apartment.findUnique({
        where: { id: data.apartment_id },
        include: { building: true }
    });

    if (!apartment) {
        throw new Error("Căn hộ không tồn tại.");
    }

    const existingBooking = await findBlockingSchedule(data.apartment_id, requestedDate);

    if (existingBooking) {
        throw new Error("Khung giờ này đã có người đặt hoặc đang được giữ chỗ.");
    }

    const schedule = await prisma.viewingSchedule.create({
        data: {
            apartment_id: data.apartment_id,
            guest_name: data.guest_name,
            guest_phone: data.guest_phone,
            guest_email: guestEmail,
            schedule_time: requestedDate,
            status: ScheduleStatus.PENDING,
            temp_locked_until: new Date(Date.now() + TEMP_LOCK_DURATION_MS)
        }
    });

    try {
        await sendViewingScheduleConfirmationEmail({
            to: guestEmail,
            guestName: data.guest_name,
            apartmentLabel: getApartmentLabel(apartment),
            scheduleTime: requestedDate
        });
    } catch (error) {
        console.error("Error sending viewing schedule confirmation email:", error);
        await prisma.viewingSchedule.delete({ where: { id: schedule.id } }).catch(() => undefined);
        throw new Error("Không thể gửi email xác nhận. Vui lòng thử lại sau.");
    }

    return schedule;
};

export const confirmScheduleService = async (id: number) => {
    const schedule = await prisma.viewingSchedule.findUnique({ where: { id } });

    if (!schedule) throw new Error("Lịch hẹn không tồn tại");

    if (schedule.status === ScheduleStatus.CANCELLED) {
        throw new Error("Lịch này đã bị hủy, không thể xác nhận.");
    }

    const blockingSchedule = await findBlockingSchedule(schedule.apartment_id, schedule.schedule_time, id);
    if (blockingSchedule) {
        throw new Error("Khung gio nay da co nguoi dat hoac dang duoc giu cho.");
    }

    return await prisma.viewingSchedule.update({
        where: { id },
        data: {
            status: ScheduleStatus.CONFIRMED,
            temp_locked_until: null
        }
    });
};

export const deleteScheduleService = async (id: number) => {
    return await prisma.viewingSchedule.delete({ where: { id } });
};

export const getSchedulesAdminService = async (date?: string, guestName?: string) => {
    const whereClause: any = {};

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

export const cancelScheduleService = async (id: number) => {
    const schedule = await prisma.viewingSchedule.findUnique({
        where: { id }
    });

    if (!schedule) {
        throw new Error("Lịch hẹn không tồn tại");
    }

    if (schedule.status === ScheduleStatus.CONFIRMED) {
        throw new Error("Không thể hủy lịch đã được Admin xác nhận. Vui lòng liên hệ trực tiếp.");
    }

    const timeDifference = schedule.schedule_time.getTime() - Date.now();
    if (timeDifference < 86400000) {
        throw new Error("Không thể hủy lịch trong vòng 24 giờ trước giờ xem.");
    }

    return await prisma.viewingSchedule.update({
        where: { id },
        data: {
            status: ScheduleStatus.CANCELLED,
            temp_locked_until: null
        }
    });
};
