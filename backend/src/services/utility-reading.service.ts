import { Prisma } from "@prisma/client";
import { prisma } from "../config/database.js";

export type UtilityReadingActor = {
    userId: number;
    role: string;
};

export type CreateUtilityReadingInput = {
    apartment_id: number;
    month: number;
    year: number;
    electric_old?: number;
    electric_new: number;
    water_old?: number;
    water_new: number;
    recorded_by?: number;
};

export type UpdateUtilityReadingInput = Partial<CreateUtilityReadingInput>;

export type UtilityReadingFilters = {
    apartment_id?: number;
    building_id?: number;
    month?: number;
    year?: number;
    recorded_by?: number;
    search?: string;
    page?: number;
    limit?: number;
};

export class UtilityReadingError extends Error {
    statusCode: number;

    constructor(message: string, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
    }
}

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

const assertValidMonthYear = (month: number, year: number) => {
    if (!Number.isInteger(month) || month < 1 || month > 12) {
        throw new UtilityReadingError("Thang ghi chi so khong hop le.");
    }

    if (!Number.isInteger(year) || year < 2000 || year > 3000) {
        throw new UtilityReadingError("Nam ghi chi so khong hop le.");
    }
};

const assertValidMeters = (data: {
    electric_old: number;
    electric_new: number;
    water_old: number;
    water_new: number;
}) => {
    const values = [
        data.electric_old,
        data.electric_new,
        data.water_old,
        data.water_new
    ];

    if (values.some((value) => !Number.isFinite(value) || value < 0)) {
        throw new UtilityReadingError("Chi so dien nuoc phai la so khong am.");
    }

    if (data.electric_new < data.electric_old) {
        throw new UtilityReadingError("Chi so dien moi khong duoc nho hon chi so dien cu.");
    }

    if (data.water_new < data.water_old) {
        throw new UtilityReadingError("Chi so nuoc moi khong duoc nho hon chi so nuoc cu.");
    }
};

const getActorStaff = async (userId: number) => {
    return prisma.staff.findUnique({
        where: { user_id: userId }
    });
};

const requireActorStaff = async (actor: UtilityReadingActor) => {
    const staff = await getActorStaff(actor.userId);

    if (!staff) {
        throw new UtilityReadingError("Tai khoan chua duoc lien ket voi ho so nhan vien.", 403);
    }

    if (!staff.building_id && actor.role !== "ADMIN") {
        throw new UtilityReadingError("Nhan vien chua duoc phan cong toa nha.", 403);
    }

    return staff;
};

const resolveManagerBuildingId = async (actor: UtilityReadingActor) => {
    if (actor.role === "ADMIN") {
        return undefined;
    }

    const staff = await requireActorStaff(actor);
    return staff.building_id ?? undefined;
};

const assertApartmentInScope = (
    apartment: { building_id: number },
    buildingId?: number
) => {
    if (buildingId !== undefined && apartment.building_id !== buildingId) {
        throw new UtilityReadingError("Ban khong co quyen thao tac voi can ho thuoc toa nha nay.", 403);
    }
};

const findPreviousReading = async (apartmentId: number, month: number, year: number) => {
    return prisma.utilityReading.findFirst({
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
};

const resolveOldMeters = async (data: CreateUtilityReadingInput) => {
    const previous = await findPreviousReading(data.apartment_id, data.month, data.year);

    const electricOld = data.electric_old ?? (previous ? toNumber(previous.electric_new) : undefined);
    const waterOld = data.water_old ?? (previous ? toNumber(previous.water_new) : undefined);

    if (electricOld === undefined || waterOld === undefined) {
        throw new UtilityReadingError("Lan ghi dau tien can nhap chi so dien cu va nuoc cu.");
    }

    return {
        electric_old: electricOld,
        water_old: waterOld
    };
};

const getReadingByIdOrThrow = async (id: number) => {
    const reading = await prisma.utilityReading.findUnique({
        where: { id },
        include: readingInclude
    });

    if (!reading) {
        throw new UtilityReadingError("Ban ghi dien nuoc khong ton tai.", 404);
    }

    return reading;
};

export const createUtilityReadingService = async (
    data: CreateUtilityReadingInput,
    actor: UtilityReadingActor
) => {
    assertValidMonthYear(data.month, data.year);

    const apartment = await prisma.apartment.findUnique({
        where: { id: data.apartment_id },
        select: { id: true, building_id: true }
    });

    if (!apartment) {
        throw new UtilityReadingError("Can ho khong ton tai.", 404);
    }

    const managerBuildingId = await resolveManagerBuildingId(actor);
    assertApartmentInScope(apartment, managerBuildingId);

    const actorStaff = await getActorStaff(actor.userId);
    let recordedBy = actorStaff?.id;

    if (actor.role === "ADMIN" && data.recorded_by) {
        const selectedStaff = await prisma.staff.findUnique({
            where: { id: data.recorded_by }
        });

        if (!selectedStaff) {
            throw new UtilityReadingError("Nhan vien ghi chi so khong ton tai.", 404);
        }

        recordedBy = selectedStaff.id;
    }

    if (!recordedBy) {
        throw new UtilityReadingError("Can co ho so nhan vien de ghi chi so dien nuoc.", 403);
    }

    const existing = await prisma.utilityReading.findFirst({
        where: {
            apartment_id: data.apartment_id,
            month: data.month,
            year: data.year
        }
    });

    if (existing) {
        throw new UtilityReadingError("Can ho nay da co ban ghi dien nuoc trong thang.");
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
        data: {
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
    actor: UtilityReadingActor
) => {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 10));
    const skip = (page - 1) * limit;

    const whereClause: Prisma.UtilityReadingWhereInput = {};
    const apartmentWhere: Prisma.ApartmentWhereInput = {};

    if (filters.apartment_id) {
        whereClause.apartment_id = filters.apartment_id;
    }

    if (filters.month) {
        whereClause.month = filters.month;
    }

    if (filters.year) {
        whereClause.year = filters.year;
    }

    if (filters.recorded_by) {
        whereClause.recorded_by = filters.recorded_by;
    }

    if (filters.building_id) {
        apartmentWhere.building_id = filters.building_id;
    }

    const managerBuildingId = await resolveManagerBuildingId(actor);
    if (managerBuildingId !== undefined) {
        if (filters.building_id && filters.building_id !== managerBuildingId) {
            throw new UtilityReadingError("Ban khong co quyen xem ban ghi cua toa nha nay.", 403);
        }

        apartmentWhere.building_id = managerBuildingId;
    }

    if (Object.keys(apartmentWhere).length > 0) {
        whereClause.apartment = apartmentWhere;
    }

    if (filters.search) {
        whereClause.OR = [
            { apartment: { room_number: { contains: filters.search, mode: "insensitive" } } },
            { apartment: { building: { branch_name: { contains: filters.search, mode: "insensitive" } } } },
            { staff: { full_name: { contains: filters.search, mode: "insensitive" } } }
        ];
    }

    const [readings, total] = await prisma.$transaction([
        prisma.utilityReading.findMany({
            where: whereClause,
            skip,
            take: limit,
            orderBy: [
                { year: "desc" },
                { month: "desc" },
                { created_at: "desc" }
            ],
            include: readingInclude
        }),
        prisma.utilityReading.count({ where: whereClause })
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
    actor: UtilityReadingActor
) => {
    const reading = await getReadingByIdOrThrow(id);

    if (actor.role === "STAFF") {
        const staff = await requireActorStaff(actor);
        if (reading.recorded_by !== staff.id) {
            throw new UtilityReadingError("Ban khong co quyen xem ban ghi nay.", 403);
        }
    } else {
        const managerBuildingId = await resolveManagerBuildingId(actor);
        assertApartmentInScope(reading.apartment, managerBuildingId);
    }

    return normalizeReading(reading);
};

export const updateUtilityReadingService = async (
    id: number,
    data: UpdateUtilityReadingInput,
    actor: UtilityReadingActor
) => {
    const current = await getReadingByIdOrThrow(id);
    const managerBuildingId = await resolveManagerBuildingId(actor);
    assertApartmentInScope(current.apartment, managerBuildingId);

    const apartmentId = data.apartment_id ?? current.apartment_id;
    const month = data.month ?? current.month;
    const year = data.year ?? current.year;

    assertValidMonthYear(month, year);

    const apartment = await prisma.apartment.findUnique({
        where: { id: apartmentId },
        select: { id: true, building_id: true }
    });

    if (!apartment) {
        throw new UtilityReadingError("Can ho khong ton tai.", 404);
    }

    assertApartmentInScope(apartment, managerBuildingId);

    const duplicate = await prisma.utilityReading.findFirst({
        where: {
            id: { not: id },
            apartment_id: apartmentId,
            month,
            year
        }
    });

    if (duplicate) {
        throw new UtilityReadingError("Can ho nay da co ban ghi dien nuoc trong thang.");
    }

    let recordedBy = data.recorded_by ?? current.recorded_by;
    if (data.recorded_by) {
        const staff = await prisma.staff.findUnique({
            where: { id: data.recorded_by }
        });

        if (!staff) {
            throw new UtilityReadingError("Nhan vien ghi chi so khong ton tai.", 404);
        }

        if (managerBuildingId !== undefined && staff.building_id !== managerBuildingId) {
            throw new UtilityReadingError("Nhan vien ghi chi so khong thuoc toa nha ban quan ly.", 403);
        }

        recordedBy = staff.id;
    }

    const meterData = {
        electric_old: data.electric_old ?? toNumber(current.electric_old),
        electric_new: data.electric_new ?? toNumber(current.electric_new),
        water_old: data.water_old ?? toNumber(current.water_old),
        water_new: data.water_new ?? toNumber(current.water_new)
    };

    assertValidMeters(meterData);

    const reading = await prisma.utilityReading.update({
        where: { id },
        data: {
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
    actor: UtilityReadingActor
) => {
    const current = await getReadingByIdOrThrow(id);
    const managerBuildingId = await resolveManagerBuildingId(actor);
    assertApartmentInScope(current.apartment, managerBuildingId);

    await prisma.utilityReading.delete({
        where: { id }
    });
};
