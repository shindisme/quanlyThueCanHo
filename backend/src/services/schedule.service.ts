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
import { getCurrentManagerAssignment } from "../utils/manager-scope.js";
import {
    sendViewingScheduleCancelledEmail,
    sendViewingScheduleConfirmationEmail,
    sendViewingScheduleConfirmedEmail
} from "./mail.service.js";

const VALID_HOURS = [9, 11, 13, 15];
const TEMP_LOCK_DURATION_MS = 10 * 60_000;
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
    "Viewing schedule was not found"
);

const conflict = (message: string) => new AppError(
    409,
    "SCHEDULE_CONFLICT",
    message
);

const slotUnavailable = () => new AppError(
    409,
    "SLOT_UNAVAILABLE",
    "This viewing time is unavailable"
);

const concurrentModification = () => new AppError(
    409,
    "CONCURRENT_MODIFICATION",
    "Viewing schedule changed during this operation"
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

const getManagerApartmentScope = (actor: Actor) => {
    const assignment = getCurrentManagerAssignment(actor);

    return {
        building_id: assignment.buildingId,
        building: assignment.assignmentWhere
    } satisfies Prisma.ApartmentWhereInput;
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
        "You do not have access to viewing schedules"
    );
};

const getApartmentLabel = (
    apartment: ScheduleWithApartment["apartment"]
) => {
    const roomLabel =
        `Phong ${apartment.room_number}, tang ${apartment.floor}`;
    return apartment.building?.branch_name
        ? `${roomLabel}, ${apartment.building.branch_name}`
        : roomLabel;
};

const getBuildingAddress = (
    apartment: ScheduleWithApartment["apartment"]
) => apartment.building?.address_new
    || apartment.building?.address_old
    || "Chua cap nhat";

const findBlockingSchedule = (
    database: Pick<
        Prisma.TransactionClient,
        "viewingSchedule"
    >,
    apartmentId: number,
    scheduleTime: Date,
    excludeId?: number,
    now = new Date()
) => database.viewingSchedule.findFirst({
    where: {
        apartment_id: apartmentId,
        schedule_time: scheduleTime,
        ...(excludeId !== undefined
            ? { id: { not: excludeId } }
            : {}),
        OR: [
            { status: ScheduleStatus.CONFIRMED },
            {
                status: ScheduleStatus.PENDING,
                temp_locked_until: { gt: now }
            }
        ]
    }
});

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
            "schedule_time must be in the future"
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
            "schedule_time must use an available viewing hour"
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
            "Apartment was not found"
        );
    }

    let schedule;
    try {
        schedule = await runSerializableTransaction(
            async (transaction) => {
                const now = new Date();
                await transaction.viewingSchedule.updateMany({
                    where: {
                        apartment_id: data.apartment_id,
                        schedule_time: requestedDate,
                        status: ScheduleStatus.PENDING,
                        OR: [
                            { temp_locked_until: null },
                            {
                                temp_locked_until: { lte: now }
                            }
                        ]
                    },
                    data: {
                        status: ScheduleStatus.CANCELLED,
                        temp_locked_until: null
                    }
                });

                const existing = await findBlockingSchedule(
                    transaction,
                    data.apartment_id,
                    requestedDate,
                    undefined,
                    now
                );
                if (existing) {
                    throw slotUnavailable();
                }

                return transaction.viewingSchedule.create({
                    data: {
                        apartment_id: data.apartment_id,
                        guest_name: data.guest_name,
                        guest_phone: data.guest_phone,
                        guest_email: data.guest_email,
                        schedule_time: requestedDate,
                        status: ScheduleStatus.PENDING,
                        temp_locked_until:
                            new Date(
                                now.getTime()
                                + TEMP_LOCK_DURATION_MS
                            )
                    }
                });
            }
        );
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError
            && error.code === "P2002"
        ) {
            throw slotUnavailable();
        }
        throw error;
    }

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
                    status: ScheduleStatus.PENDING,
                    temp_locked_until: schedule.temp_locked_until
                }
            })
        ).catch(() => undefined);
        throw new AppError(
            503,
            "EMAIL_UNAVAILABLE",
            "Unable to send the viewing confirmation email"
        );
    }

    return schedule;
};

export const getViewingAvailabilityService = async (
    apartmentId: number,
    date: string
) => {
    const { start, end } = getVietnamDayBounds(date);

    const schedules = await prisma.viewingSchedule.findMany({
        where: {
            apartment_id: apartmentId,
            schedule_time: {
                gte: start,
                lt: end
            },
            OR: [
                { status: ScheduleStatus.CONFIRMED },
                {
                    status: ScheduleStatus.PENDING,
                    temp_locked_until: { gt: new Date() }
                }
            ]
        },
        select: {
            schedule_time: true,
            status: true,
            temp_locked_until: true
        },
        orderBy: { schedule_time: "asc" }
    });

    return {
        apartment_id: apartmentId,
        date: start,
        available_hours: VALID_HOURS.filter((hour) => (
            !schedules.some((schedule) =>
                getVietnamTimeParts(
                    schedule.schedule_time
                ).hour === hour
            )
        )),
        occupied: schedules
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
            orderBy: { schedule_time: "asc" }
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
        throw conflict("A cancelled schedule cannot be confirmed");
    }
    if (schedule.status === ScheduleStatus.CONFIRMED) {
        throw conflict("The viewing schedule is already confirmed");
    }
    if (!schedule.guest_email) {
        throw conflict("The viewing schedule has no guest email");
    }

    const blocking = await findBlockingSchedule(
        prisma,
        schedule.apartment_id,
        schedule.schedule_time,
        id
    );
    if (blocking) {
        throw conflict("This viewing time is unavailable");
    }

    let confirmed;
    try {
        confirmed = await prisma.viewingSchedule.update({
            where: getScopedUniqueWhere(schedule, actor),
            data: {
                status: ScheduleStatus.CONFIRMED,
                temp_locked_until: null
            },
            include: scheduleInclude
        });
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError
            && error.code === "P2002"
        ) {
            throw slotUnavailable();
        }
        throw error;
    }

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
    actor: Actor
) => {
    const schedule = await getScheduleById(id, actor);

    if (schedule.status === ScheduleStatus.CONFIRMED) {
        throw conflict("A confirmed viewing schedule cannot be cancelled");
    }
    if (schedule.status === ScheduleStatus.CANCELLED) {
        throw conflict("The viewing schedule is already cancelled");
    }

    const cancelled = await prisma.viewingSchedule.update({
        where: getScopedUniqueWhere(schedule, actor),
        data: {
            status: ScheduleStatus.CANCELLED,
            temp_locked_until: null
        },
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
                scheduleTime: schedule.schedule_time
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
