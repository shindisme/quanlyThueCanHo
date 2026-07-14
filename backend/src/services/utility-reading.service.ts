import {
    Prisma,
    Role
} from "@prisma/client";
import { prisma } from "../config/database.js";
import { AppError } from "../errors/app-error.js";
import type {
    CreateUtilityReadingRequest,
    ListUtilityReadingsRequest,
    UpdateUtilityReadingRequest
} from "../schemas/utility-reading.schema.js";
import type { Actor } from "../types/auth.js";
import {
    getCurrentManagerAssignment,
    getCurrentStaffAssignment
} from "../utils/manager-scope.js";

export type CreateUtilityReadingInput =
    CreateUtilityReadingRequest["body"];
export type UpdateUtilityReadingInput =
    UpdateUtilityReadingRequest["body"];
export type UtilityReadingFilters =
    ListUtilityReadingsRequest["query"];

const readingInclude = {
    apartment: {
        select: {
            id: true,
            building_id: true,
            floor: true,
            room_number: true,
            building: {
                select: {
                    id: true,
                    branch_name: true,
                    address_new: true
                }
            }
        }
    },
    staff: {
        select: {
            id: true,
            full_name: true,
            phone: true,
            position: true,
            building_id: true
        }
    }
} satisfies Prisma.UtilityReadingInclude;

type UtilityReadingWithRelations = Prisma.UtilityReadingGetPayload<{
    include: typeof readingInclude;
}>;

type Assignment = ReturnType<typeof getCurrentManagerAssignment>;

const notFound = () => new AppError(
    404,
    "NOT_FOUND",
    "Chỉ số dịch vụ không tồn tại"
);

const validationError = (message: string) => new AppError(
    400,
    "VALIDATION_ERROR",
    message
);

const forbidden = (message: string) => new AppError(
    403,
    "FORBIDDEN",
    message
);

const getUtilityAssignment = (actor: Actor) => {
    if (actor.role === Role.ADMIN) {
        return undefined;
    }

    if (
        actor.role !== Role.MANAGER
        && actor.role !== Role.STAFF
    ) {
        throw forbidden("You do not have access to utility readings");
    }

    return actor.role === Role.MANAGER
        ? getCurrentManagerAssignment(actor)
        : getCurrentStaffAssignment(actor);
};

const getApartmentScope = (assignment: Assignment) => ({
    building_id: assignment.buildingId,
    building: assignment.assignmentWhere
}) satisfies Prisma.ApartmentWhereInput;

const getReadingScope = (
    actor: Actor,
    assignment: Assignment
) => ({
    apartment: getApartmentScope(assignment),
    ...(actor.role === Role.STAFF
        ? { recorded_by: actor.staffId }
        : {})
}) satisfies Prisma.UtilityReadingWhereInput;

const toNumber = (value: Prisma.Decimal | number) => Number(value);

const normalizeReading = (reading: UtilityReadingWithRelations) => {
    const electricOld = toNumber(reading.electric_old);
    const electricNew = toNumber(reading.electric_new);
    const waterOld = toNumber(reading.water_old);
    const waterNew = toNumber(reading.water_new);

    return {
        ...reading,
        electric_old: electricOld,
        electric_new: electricNew,
        water_old: waterOld,
        water_new: waterNew,
        electric_consumption: electricNew - electricOld,
        water_consumption: waterNew - waterOld
    };
};

const assertValidMeters = (data: {
    electric_old: number;
    electric_new: number;
    water_old: number;
    water_new: number;
}) => {
    if (data.electric_new < data.electric_old) {
        throw validationError(
            "electric_new must not be less than electric_old"
        );
    }

    if (data.water_new < data.water_old) {
        throw validationError(
            "water_new must not be less than water_old"
        );
    }
};

const findPreviousReading = async (
    apartmentId: number,
    month: number,
    year: number
) => prisma.utilityReading.findFirst({
    where: {
        apartment_id: apartmentId,
        OR: [
            { year: { lt: year } },
            { year, month: { lt: month } }
        ]
    },
    orderBy: [
        { year: "desc" },
        { month: "desc" },
        { created_at: "desc" }
    ]
});

const resolveOldMeters = async (data: CreateUtilityReadingInput) => {
    const previous = await findPreviousReading(
        data.apartment_id,
        data.month,
        data.year
    );
    const electricOld = data.electric_old
        ?? (previous ? toNumber(previous.electric_new) : undefined);
    const waterOld = data.water_old
        ?? (previous ? toNumber(previous.water_new) : undefined);

    if (electricOld === undefined || waterOld === undefined) {
        throw validationError(
            "The first utility reading requires old meter values"
        );
    }

    return {
        electric_old: electricOld,
        water_old: waterOld
    };
};

const getReadingById = async (
    id: number,
    actor: Actor
) => {
    const assignment = getUtilityAssignment(actor);
    const reading = assignment
        ? await prisma.utilityReading.findFirst({
            where: {
                id,
                ...getReadingScope(actor, assignment)
            },
            include: readingInclude
        })
        : await prisma.utilityReading.findUnique({
            where: { id },
            include: readingInclude
        });

    if (!reading) {
        throw notFound();
    }

    return {
        reading,
        assignment
    };
};

const getRecordedBy = (
    data: { recorded_by?: number },
    actor: Actor,
    assignment?: Assignment
) => {
    if (assignment) {
        if (data.recorded_by !== undefined) {
            throw validationError(
                "recorded_by is derived from the authenticated actor"
            );
        }

        return actor.staffId!;
    }

    const recordedBy = data.recorded_by ?? actor.staffId;
    if (recordedBy === undefined) {
        throw validationError(
            "recorded_by is required when an Admin has no staff profile"
        );
    }

    return recordedBy;
};

export const createUtilityReadingService = async (
    data: CreateUtilityReadingInput,
    actor: Actor
) => {
    const assignment = getUtilityAssignment(actor);
    const recordedBy = getRecordedBy(data, actor, assignment);
    const apartmentWhere: Prisma.ApartmentWhereInput = assignment
        ? {
            id: data.apartment_id,
            ...getApartmentScope(assignment)
        }
        : { id: data.apartment_id };
    const apartment = await prisma.apartment.findFirst({
        where: apartmentWhere,
        select: {
            id: true,
            building_id: true
        }
    });

    if (!apartment) {
        throw notFound();
    }

    const oldMeters = await resolveOldMeters(data);
    const meterData = {
        electric_old: oldMeters.electric_old,
        electric_new: data.electric_new,
        water_old: oldMeters.water_old,
        water_new: data.water_new
    };
    assertValidMeters(meterData);

    const reading = await prisma.utilityReading.create({
        data: assignment
            ? {
                month: data.month,
                year: data.year,
                ...meterData,
                apartment: {
                    connect: {
                        id: data.apartment_id,
                        ...getApartmentScope(assignment)
                    }
                },
                staff: {
                    connect: {
                        id: recordedBy,
                        user_id: actor.userId,
                        building_id: assignment.buildingId,
                        building: assignment.assignmentWhere
                    }
                }
            }
            : {
                apartment_id: data.apartment_id,
                month: data.month,
                year: data.year,
                recorded_by: recordedBy,
                ...meterData
            },
        include: readingInclude
    });

    return normalizeReading(reading);
};

export const getUtilityReadingsService = async (
    filters: UtilityReadingFilters,
    actor: Actor
) => {
    const assignment = getUtilityAssignment(actor);
    const page = filters.page;
    const limit = filters.limit;
    const where: Prisma.UtilityReadingWhereInput = {};

    if (filters.apartment_id !== undefined) {
        where.apartment_id = filters.apartment_id;
    }
    if (filters.month !== undefined) {
        where.month = filters.month;
    }
    if (filters.year !== undefined) {
        where.year = filters.year;
    }
    if (filters.recorded_by !== undefined) {
        where.recorded_by = filters.recorded_by;
    }

    if (assignment) {
        Object.assign(where, getReadingScope(actor, assignment));
    } else if (filters.building_id !== undefined) {
        where.apartment = {
            building_id: filters.building_id
        };
    }

    if (filters.search) {
        where.OR = [
            {
                apartment: {
                    room_number: {
                        contains: filters.search,
                        mode: "insensitive"
                    }
                }
            },
            {
                apartment: {
                    building: {
                        branch_name: {
                            contains: filters.search,
                            mode: "insensitive"
                        }
                    }
                }
            },
            {
                staff: {
                    full_name: {
                        contains: filters.search,
                        mode: "insensitive"
                    }
                }
            }
        ];
    }

    const skip = (page - 1) * limit;
    const [readings, total] = await prisma.$transaction([
        prisma.utilityReading.findMany({
            where,
            skip,
            take: limit,
            orderBy: [
                { year: "desc" },
                { month: "desc" },
                { created_at: "desc" }
            ],
            include: readingInclude
        }),
        prisma.utilityReading.count({ where })
    ]);

    return {
        data: readings.map(normalizeReading),
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
};

export const getUtilityReadingByIdService = async (
    id: number,
    actor: Actor
) => {
    const { reading } = await getReadingById(id, actor);
    return normalizeReading(reading);
};

export const updateUtilityReadingService = async (
    id: number,
    data: UpdateUtilityReadingInput,
    actor: Actor
) => {
    const {
        reading: current,
        assignment
    } = await getReadingById(id, actor);
    const recordedBy = assignment
        ? getRecordedBy(data, actor, assignment)
        : data.recorded_by ?? current.recorded_by;
    const apartmentId = data.apartment_id ?? current.apartment_id;
    const month = data.month ?? current.month;
    const year = data.year ?? current.year;
    const apartmentWhere: Prisma.ApartmentWhereInput = assignment
        ? {
            id: apartmentId,
            ...getApartmentScope(assignment)
        }
        : { id: apartmentId };
    const apartment = await prisma.apartment.findFirst({
        where: apartmentWhere,
        select: { id: true }
    });

    if (!apartment) {
        throw notFound();
    }

    const meterData = {
        electric_old: data.electric_old
            ?? toNumber(current.electric_old),
        electric_new: data.electric_new
            ?? toNumber(current.electric_new),
        water_old: data.water_old
            ?? toNumber(current.water_old),
        water_new: data.water_new
            ?? toNumber(current.water_new)
    };
    assertValidMeters(meterData);

    const where: Prisma.UtilityReadingWhereUniqueInput = assignment
        ? {
            id,
            ...getReadingScope(actor, assignment)
        }
        : { id };
    const reading = await prisma.utilityReading.update({
        where,
        data: assignment
            ? {
                month,
                year,
                ...meterData,
                apartment: {
                    connect: {
                        id: apartmentId,
                        ...getApartmentScope(assignment)
                    }
                },
                staff: {
                    connect: {
                        id: recordedBy,
                        user_id: actor.userId,
                        building_id: assignment.buildingId,
                        building: assignment.assignmentWhere
                    }
                }
            }
            : {
                apartment_id: apartmentId,
                month,
                year,
                recorded_by: recordedBy,
                ...meterData
            },
        include: readingInclude
    });

    return normalizeReading(reading);
};

export const deleteUtilityReadingService = async (
    id: number,
    actor: Actor
) => {
    const assignment = getUtilityAssignment(actor);

    if (assignment) {
        const result = await prisma.utilityReading.deleteMany({
            where: {
                id,
                ...getReadingScope(actor, assignment)
            }
        });

        if (result.count === 0) {
            throw notFound();
        }
        return;
    }

    await prisma.utilityReading.delete({
        where: { id }
    });
};
