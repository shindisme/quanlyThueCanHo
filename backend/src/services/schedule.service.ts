import {
    Prisma,
    Role,
    ScheduleStatus
} from "@prisma/client";
import { prisma } from "../config/database.js";
import { AppError } from "../errors/app-error.js";
import type {
    BookViewingRequest,
    ListSchedulesRequest
} from "../schemas/schedule.schema.js";
import type { Actor } from "../types/auth.js";
import { getManagerApartmentScope } from "../utils/manager-scope.js";
import {
    sendViewingScheduleCancelledEmail,
    sendViewingScheduleConfirmationEmail,
    sendViewingScheduleConfirmedEmail
} from "./mail.service.js";

const VALID_HOURS = [9, 11, 13, 15];
const DAILY_VIEWING_CAPACITY_PER_BUILDING = 5;
const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";
const VIETNAM_OFFSET = "+07:00";
const DAY_MS = 24 * 60 * 60_000;

const vietnamTimeFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: VIETNAM_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
});
const vietnamDateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: VIETNAM_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
});

const getVietnamTimeParts = (date: Date) => {
    const parts = vietnamTimeFormatter.formatToParts(date);
    const getPart = (type: Intl.DateTimeFormatPartTypes) =>
        Number(parts.find((part) => part.type === type)?.value);

    return {
        hour: getPart("hour"),
        minute: getPart("minute"),
        second: getPart("second")
    };
};

const getVietnamDayBounds = (date: string) => {
    const start = new Date(`${date}T00:00:00${VIETNAM_OFFSET}`);

    return {
        start,
        end: new Date(start.getTime() + DAY_MS)
    };
};

const getVietnamDateString = (date: Date) => {
    const parts = vietnamDateFormatter.formatToParts(date);
    const value = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((part) => part.type === type)?.value ?? "";

    return `${value("year")}-${value("month")}-${value("day")}`;
};

const scheduleInclude = {
    apartment: {
        include: {
            building: true
        }
    }
} satisfies Prisma.ViewingScheduleInclude;

type ScheduleWithApartment =
    Prisma.ViewingScheduleGetPayload<{
        include: typeof scheduleInclude;
    }>;

const notFound = () => new AppError(
    404,
    "NOT_FOUND",
    "Lịch xem căn hộ không tồn tại"
);

const conflict = (message: string) => new AppError(
    409,
    "SCHEDULE_CONFLICT",
    message
);

const dayCapacityReached = () => new AppError(
    409,
    "VIEWING_DAY_FULL",
    `Tòa nhà đã đủ ${DAILY_VIEWING_CAPACITY_PER_BUILDING} lịch xem trong ngày này. Vui lòng chọn ngày khác.`
);

const countedScheduleWhere: Prisma.ViewingScheduleWhereInput = ({
    status: {
        in: [ScheduleStatus.PENDING, ScheduleStatus.CONFIRMED]
    }
});

const concurrentModification = () => new AppError(
    409,
    "CONCURRENT_MODIFICATION",
    "Lịch xem căn hộ đã bị thay đổi trong quá trình thực hiện"
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



const getScheduleScope = (
    actor: Actor
): Prisma.ViewingScheduleWhereInput => {
    if (actor.role === Role.ADMIN) {
        return {};
    }

    if (actor.role === Role.MANAGER) {
        return {
            apartment: getManagerApartmentScope(actor)
        };
    }

    throw new AppError(
        403,
        "FORBIDDEN",
        "Bạn không có quyền truy cập lịch xem căn hộ"
    );
};

const getApartmentLabel = (
    apartment: ScheduleWithApartment["apartment"]
) => {
    const roomLabel =
        `Phòng ${apartment.room_number}, tầng ${apartment.floor}`;
    return apartment.building?.branch_name
        ? `${roomLabel}, ${apartment.building.branch_name}`
        : roomLabel;
};

const getBuildingAddress = (
    apartment: ScheduleWithApartment["apartment"]
) => (apartment.building as { address?: string; address_new?: string })?.address
|| (apartment.building as { address?: string; address_new?: string })?.address_new
    || "Chưa cập nhật";

const getScheduleById = async (
    id: number,
    actor: Actor
) => {
    const scope = getScheduleScope(actor);
    const schedule = actor.role === Role.ADMIN
        ? await prisma.viewingSchedule.findUnique({
            where: { id },
            include: scheduleInclude
        })
        : await prisma.viewingSchedule.findFirst({
            where: {
                id,
                ...scope
            },
            include: scheduleInclude
        });

    if (!schedule) {
        throw notFound();
    }

    return schedule;
};

const getScopedUniqueWhere = (
    schedule: ScheduleWithApartment,
    actor: Actor
): Prisma.ViewingScheduleWhereUniqueInput =>
    actor.role === Role.ADMIN
        ? {
            id: schedule.id,
            status: schedule.status
        }
        : {
            id: schedule.id,
            status: schedule.status,
            apartment: getManagerApartmentScope(actor)
        };

export const bookViewingService = async (
    data: BookViewingRequest["body"]
) => {
    const requestedDate = data.schedule_time;
    if (requestedDate.getTime() <= Date.now()) {
        throw new AppError(
            400,
            "VALIDATION_ERROR",
            "Thời gian xem phải ở tương lai"
        );
    }

    const vietnamTime = getVietnamTimeParts(requestedDate);
    if (
        !VALID_HOURS.includes(vietnamTime.hour)
        || vietnamTime.minute !== 0
        || vietnamTime.second !== 0
        || requestedDate.getUTCMilliseconds() !== 0
    ) {
        throw new AppError(
            400,
            "VALIDATION_ERROR",
            "Thời gian xem phải chọn khung giờ khả dụng"
        );
    }

    const apartment = await prisma.apartment.findUnique({
        where: { id: data.apartment_id },
        include: { building: true }
    });

    if (!apartment) {
        throw new AppError(
            404,
            "NOT_FOUND",
            "Căn hộ không tồn tại"
        );
    }

    const schedule = await runSerializableTransaction(
        async (transaction) => {
                const requestedDay = getVietnamDayBounds(
                    getVietnamDateString(requestedDate)
                );
                const bookedToday = await transaction.viewingSchedule.count({
                    where: {
                        apartment: {
                            building_id: apartment.building_id
                        },
                        schedule_time: {
                            gte: requestedDay.start,
                            lt: requestedDay.end
                        },
                        ...countedScheduleWhere
                    }
                });
                if (bookedToday >= DAILY_VIEWING_CAPACITY_PER_BUILDING) {
                    throw dayCapacityReached();
                }

                return transaction.viewingSchedule.create({
                    data: {
                        apartment_id: data.apartment_id,
                        guest_name: data.guest_name,
                        guest_phone: data.guest_phone,
                        guest_email: data.guest_email,
                        schedule_time: requestedDate,
                        status: ScheduleStatus.PENDING
                    }
                });
        }
    );

    try {
        await sendViewingScheduleConfirmationEmail({
            to: data.guest_email,
            guestName: data.guest_name,
            apartmentLabel: getApartmentLabel({
                ...apartment,
                building: apartment.building
            }),
            buildingAddress: getBuildingAddress({
                ...apartment,
                building: apartment.building
            }),
            scheduleTime: requestedDate
        });
    } catch {
        await Promise.resolve(
            prisma.viewingSchedule.deleteMany({
                where: {
                    id: schedule.id,
                    status: ScheduleStatus.PENDING
                }
            })
        ).catch(() => undefined);
        throw new AppError(
            503,
            "EMAIL_UNAVAILABLE",
            "Không thể gửi email xác nhận lịch xem"
        );
    }

    return schedule;
};

export const getViewingAvailabilityService = async (
    apartmentId: number,
    date: string
) => {
    const { start, end } = getVietnamDayBounds(date);
    const now = new Date();
    const todayStr = getVietnamDateString(now);
    const todayBounds = getVietnamDayBounds(todayStr);

    if (start.getTime() < todayBounds.start.getTime()) {
        throw new AppError(
            400,
            "VALIDATION_ERROR",
            "Không thể chọn ngày xem trong quá khứ"
        );
    }

    const apartment = await prisma.apartment.findUnique({
        where: { id: apartmentId },
        select: { id: true, building_id: true }
    });
    if (!apartment) {
        throw new AppError(404, "NOT_FOUND", "Căn hộ không tồn tại");
    }

    const bookedToday = await prisma.viewingSchedule.count({
        where: {
            apartment: { building_id: apartment.building_id },
            schedule_time: { gte: start, lt: end },
            ...countedScheduleWhere
        }
    });
    const isDayFull = bookedToday >= DAILY_VIEWING_CAPACITY_PER_BUILDING;

    return {
        apartment_id: apartmentId,
        date: start,
        daily_capacity: DAILY_VIEWING_CAPACITY_PER_BUILDING,
        booked_count: bookedToday,
        is_day_full: isDayFull,
        available_hours: isDayFull ? [] : VALID_HOURS
    };
};

export const getSchedulesAdminService = async (
    filters: ListSchedulesRequest["query"],
    actor: Actor
) => {
    const page = filters.page;
    const limit = filters.limit;
    const where = getScheduleScope(actor);

    if (
        actor.role === Role.ADMIN
        && filters.building_id !== undefined
    ) {
        where.apartment = {
            building_id: filters.building_id
        };
    }
    if (filters.apartment_id !== undefined) {
        where.apartment_id = filters.apartment_id;
    }
    if (filters.status) {
        where.status = filters.status;
    }
    if (filters.guestName) {
        where.guest_name = {
            contains: filters.guestName,
            mode: "insensitive"
        };
    }
    if (filters.date) {
        const { start, end } = getVietnamDayBounds(filters.date);
        where.schedule_time = {
            gte: start,
            lt: end
        };
    }

    const skip = (page - 1) * limit;
    const [schedules, total] = await prisma.$transaction([
        prisma.viewingSchedule.findMany({
            where,
            include: scheduleInclude,
            skip,
            take: limit,
            orderBy: { created_at: "desc" }
        }),
        prisma.viewingSchedule.count({ where })
    ]);

    return {
        data: schedules,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
};

export const confirmScheduleService = async (
    id: number,
    actor: Actor
) => {
    const schedule = await getScheduleById(id, actor);

    if (schedule.status === ScheduleStatus.CANCELLED) {
        throw conflict("Không thể xác nhận lịch xem căn hộ đã hủy");
    }
    if (schedule.status === ScheduleStatus.CONFIRMED) {
        throw conflict("Lịch xem căn hộ đã được xác nhận");
    }
    if (!schedule.guest_email) {
        throw conflict("Lịch xem căn hộ không có email khách xem");
    }

    const confirmed = await prisma.viewingSchedule.update({
        where: getScopedUniqueWhere(schedule, actor),
        data: { status: ScheduleStatus.CONFIRMED },
        include: scheduleInclude
    });

    await sendViewingScheduleConfirmedEmail({
        to: schedule.guest_email,
        guestName: schedule.guest_name,
        apartmentLabel: getApartmentLabel(schedule.apartment),
        buildingAddress: getBuildingAddress(schedule.apartment),
        scheduleTime: schedule.schedule_time
    });

    return confirmed;
};

export const cancelScheduleService = async (
    id: number,
    actor: Actor,
    cancelReason?: string
) => {
    const schedule = await getScheduleById(id, actor);

    if (schedule.status === ScheduleStatus.CANCELLED) {
        throw conflict("Lịch xem căn hộ đã được hủy");
    }

    const cancelled = await prisma.viewingSchedule.update({
        where: getScopedUniqueWhere(schedule, actor),
        data: {
            status: ScheduleStatus.CANCELLED,
            cancel_reason: cancelReason || null
        } as any,
        include: scheduleInclude
    });

    let emailSent = false;
    if (schedule.guest_email) {
        try {
            await sendViewingScheduleCancelledEmail({
                to: schedule.guest_email,
                guestName: schedule.guest_name,
                apartmentLabel:
                    getApartmentLabel(schedule.apartment),
                buildingAddress:
                    getBuildingAddress(schedule.apartment),
                scheduleTime: schedule.schedule_time,
                cancelReason
            });
            emailSent = true;
        } catch {
            emailSent = false;
        }
    }

    return {
        schedule: cancelled,
        emailSent
    };
};

export const deleteScheduleService = async (
    id: number,
    actor: Actor
) => {
    if (actor.role === Role.ADMIN) {
        return prisma.viewingSchedule.delete({
            where: { id }
        });
    }

    const result = await prisma.viewingSchedule.deleteMany({
        where: {
            id,
            ...getScheduleScope(actor)
        }
    });

    if (result.count === 0) {
        throw notFound();
    }

    return { id };
};

export const markAttendedScheduleService = async (
    id: number,
    actor: Actor
) => {
    const schedule = await getScheduleById(id, actor);

    return prisma.viewingSchedule.update({
        where: getScopedUniqueWhere(schedule, actor),
        data: {
            attendance_status: "ATTENDED"
        } as any,
        include: scheduleInclude
    });
};

export const markAbsentScheduleService = async (
    id: number,
    actor: Actor
) => {
    const schedule = await getScheduleById(id, actor);

    return prisma.viewingSchedule.update({
        where: getScopedUniqueWhere(schedule, actor),
        data: {
            attendance_status: "ABSENT"
        } as any,
        include: scheduleInclude
    });
};


