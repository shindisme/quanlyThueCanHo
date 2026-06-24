import { ApartmentStatus, ContractStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/database.js";

export type ContractActor = {
    userId: number;
    role: string;
};

export type ContractFilters = {
    status?: ContractStatus;
    tenant_id?: number;
    apartment_id?: number;
    building_id?: number;
    search?: string;
    page?: number;
    limit?: number;
};

export class ContractError extends Error {
    statusCode: number;

    constructor(message: string, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
    }
}

const contractInclude = {
    tenant: {
        select: {
            id: true,
            full_name: true,
            phone: true,
            email: true,
            citizen_id: true,
            user_id: true
        }
    },
    apartment: {
        include: {
            building: true
        }
    }
} satisfies Prisma.RentalContractInclude;

type ContractWithRelations = Prisma.RentalContractGetPayload<{
    include: typeof contractInclude;
}>;

const toNumber = (value: Prisma.Decimal | number) => Number(value);

const normalizeContract = (contract: ContractWithRelations) => ({
    ...contract,
    deposit_amount: toNumber(contract.deposit_amount),
    monthly_rent: toNumber(contract.monthly_rent),
    apartment: {
        ...contract.apartment,
        area: toNumber(contract.apartment.area),
        rental_price: toNumber(contract.apartment.rental_price)
    }
});

const toPositiveInteger = (value: unknown, fieldName: string) => {
    const numberValue = Number(value);

    if (!Number.isInteger(numberValue) || numberValue <= 0) {
        throw new ContractError(`${fieldName} không hợp lệ`);
    }

    return numberValue;
};

const toPositiveNumber = (value: unknown, fieldName: string) => {
    const numberValue = Number(value);

    if (!Number.isFinite(numberValue) || numberValue <= 0) {
        throw new ContractError(`${fieldName} phải lớn hơn 0`);
    }

    return numberValue;
};

const parseDate = (value: unknown, fieldName: string) => {
    if (typeof value !== "string" && !(value instanceof Date)) {
        throw new ContractError(`${fieldName} không hợp lệ`);
    }

    if (typeof value === "string" && value.trim() === "") {
        throw new ContractError(`${fieldName} không hợp lệ`);
    }

    const trimmedValue = value instanceof Date ? value : value.trim();
    const dateOnlyMatch = typeof trimmedValue === "string"
        ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmedValue)
        : null;

    const date = dateOnlyMatch
        ? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]))
        : new Date(trimmedValue);

    if (Number.isNaN(date.getTime())) {
        throw new ContractError(`${fieldName} không hợp lệ`);
    }

    if (
        dateOnlyMatch
        && (
            date.getFullYear() !== Number(dateOnlyMatch[1])
            || date.getMonth() !== Number(dateOnlyMatch[2]) - 1
            || date.getDate() !== Number(dateOnlyMatch[3])
        )
    ) {
        throw new ContractError(`${fieldName} không hợp lệ`);
    }

    return date;
};

const startOfDay = (date: Date) => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
};

const ensureEndDateIsValid = (endDate: Date, startDate?: Date) => {
    const today = startOfDay(new Date());

    if (startOfDay(endDate) < today) {
        throw new ContractError("Ngày hết hạn không thể nhỏ hơn ngày hiện tại");
    }

    if (startDate && endDate <= startDate) {
        throw new ContractError("Ngày hết hạn phải lớn hơn ngày bắt đầu");
    }
};

const parseEndContractDate = (value: unknown) => {
    const endDate = value === undefined || value === null || value === ""
        ? new Date()
        : parseDate(value, "Ngày kết thúc hợp đồng");

    if (startOfDay(endDate) > startOfDay(new Date())) {
        throw new ContractError("Ngày kết thúc hợp đồng không thể lớn hơn ngày hiện tại");
    }

    return endDate;
};

const getActorStaff = async (userId: number) => {
    return prisma.staff.findUnique({
        where: { user_id: userId },
        select: {
            id: true,
            building_id: true
        }
    });
};

const getActorTenant = async (userId: number) => {
    return prisma.tenant.findUnique({
        where: { user_id: userId },
        select: {
            id: true,
            user_id: true
        }
    });
};

const requireManagerBuildingId = async (actor: ContractActor) => {
    if (actor.role === "ADMIN") {
        return undefined;
    }

    const staff = await getActorStaff(actor.userId);
    if (!staff) {
        throw new ContractError("Tài khoản chưa được liên kết với hồ sơ nhân viên", 403);
    }

    if (!staff.building_id) {
        throw new ContractError("Nhân viên chưa được phân công tòa nhà", 403);
    }

    return staff.building_id;
};

const assertCanManageContracts = (actor: ContractActor) => {
    if (!["ADMIN", "MANAGER"].includes(actor.role)) {
        throw new ContractError("Bạn không có quyền quản lý hợp đồng", 403);
    }
};

const requireTenantId = async (actor: ContractActor) => {
    const tenant = await getActorTenant(actor.userId);
    if (!tenant) {
        throw new ContractError("Tai khoan chua duoc lien ket voi ho so nguoi thue", 403);
    }

    return tenant.id;
};

const getContractScopeWhere = async (actor: ContractActor): Promise<Prisma.RentalContractWhereInput> => {
    if (actor.role === "ADMIN") {
        return {};
    }

    if (actor.role === "MANAGER") {
        const buildingId = await requireManagerBuildingId(actor);
        return {
            apartment: {
                building_id: buildingId
            }
        };
    }

    if (actor.role === "TENANT") {
        return {
            tenant_id: await requireTenantId(actor)
        };
    }

    throw new ContractError("Ban khong co quyen truy cap hop dong", 403);
};

const getContractByIdOrThrow = async (id: number) => {
    const contract = await prisma.rentalContract.findUnique({
        where: { id },
        include: contractInclude
    });

    if (!contract) {
        throw new ContractError("Hop dong khong ton tai", 404);
    }

    return contract;
};

const assertContractAccessible = async (contract: ContractWithRelations, actor: ContractActor) => {
    if (actor.role === "ADMIN") {
        return;
    }

    if (actor.role === "MANAGER") {
        const buildingId = await requireManagerBuildingId(actor);
        if (contract.apartment.building_id !== buildingId) {
            throw new ContractError("Ban khong co quyen xem hop dong cua toa nha nay", 403);
        }
        return;
    }

    if (actor.role === "TENANT") {
        const tenantId = await requireTenantId(actor);
        if (contract.tenant_id !== tenantId) {
            throw new ContractError("Ban khong co quyen xem hop dong nay", 403);
        }
        return;
    }

    throw new ContractError("Ban khong co quyen truy cap hop dong", 403);
};

export const getContractsService = async (filters: ContractFilters, actor: ContractActor) => {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 10));
    const skip = (page - 1) * limit;

    const andFilters: Prisma.RentalContractWhereInput[] = [await getContractScopeWhere(actor)];

    if (filters.status) {
        andFilters.push({ status: filters.status });
    }

    if (filters.tenant_id) {
        andFilters.push({ tenant_id: filters.tenant_id });
    }

    if (filters.apartment_id) {
        andFilters.push({ apartment_id: filters.apartment_id });
    }

    if (filters.building_id) {
        if (actor.role === "MANAGER") {
            const managerBuildingId = await requireManagerBuildingId(actor);
            if (managerBuildingId !== filters.building_id) {
                throw new ContractError("Ban khong co quyen xem hop dong cua toa nha nay", 403);
            }
        }

        andFilters.push({
            apartment: {
                building_id: filters.building_id
            }
        });
    }

    const search = filters.search?.trim();
    if (search) {
        const idText = search.replace(/^HD-?/i, "").replace(/^0+/, "") || "0";
        const id = Number(idText);
        const searchFilters: Prisma.RentalContractWhereInput[] = [
            { tenant: { full_name: { contains: search, mode: "insensitive" } } },
            { tenant: { phone: { contains: search } } },
            { tenant: { email: { contains: search, mode: "insensitive" } } },
            { apartment: { room_number: { contains: search, mode: "insensitive" } } },
            { apartment: { building: { branch_name: { contains: search, mode: "insensitive" } } } }
        ];

        if (Number.isInteger(id) && id > 0) {
            searchFilters.push({ id });
        }

        andFilters.push({ OR: searchFilters });
    }

    const whereClause: Prisma.RentalContractWhereInput = { AND: andFilters };

    const [contracts, total] = await prisma.$transaction([
        prisma.rentalContract.findMany({
            where: whereClause,
            skip,
            take: limit,
            orderBy: { created_at: "desc" },
            include: contractInclude
        }),
        prisma.rentalContract.count({ where: whereClause })
    ]);

    return {
        data: contracts.map(normalizeContract),
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
};

export const getContractByIdService = async (id: number, actor: ContractActor) => {
    const contractId = toPositiveInteger(id, "Hop dong");
    const contract = await getContractByIdOrThrow(contractId);
    await assertContractAccessible(contract, actor);
    return normalizeContract(contract);
};

export const createContractService = async (data: any) => {
    const apartmentId = toPositiveInteger(data.apartment_id, "Căn hộ");
    const tenantId = toPositiveInteger(data.tenant_id, "Người thuê");
    const startDate = parseDate(data.start_date, "Ngày bắt đầu");
    const endDate = parseDate(data.end_date, "Ngày hết hạn");
    const signedAt = parseDate(data.signed_at, "Ngày ký");
    const depositAmount = toPositiveNumber(data.deposit_amount, "Tiền cọc");
    const monthlyRent = toPositiveNumber(data.monthly_rent, "Tiền thuê hàng tháng");

    ensureEndDateIsValid(endDate, startDate);

    return await prisma.$transaction(async (tx) => {
        const [apartment, tenant, existingApartmentContract] = await Promise.all([
            tx.apartment.findUnique({
                where: { id: apartmentId },
                select: { id: true, status: true }
            }),
            tx.tenant.findUnique({
                where: { id: tenantId },
                select: { id: true }
            }),
            tx.rentalContract.findFirst({
                where: {
                    apartment_id: apartmentId,
                    status: ContractStatus.ACTIVE
                },
                select: { id: true }
            })
        ]);

        if (!apartment) {
            throw new ContractError("Căn hộ không tồn tại");
        }

        if (apartment.status !== ApartmentStatus.AVAILABLE) {
            throw new ContractError("Căn hộ không sẵn sàng để tạo hợp đồng");
        }

        if (!tenant) {
            throw new ContractError("Người thuê không tồn tại");
        }

        if (existingApartmentContract) {
            throw new ContractError("Căn hộ đang có hợp đồng hiệu lực");
        }

        const contract = await tx.rentalContract.create({
            data: {
                apartment_id: apartmentId,
                tenant_id: tenantId,
                start_date: startDate,
                end_date: endDate,
                deposit_amount: depositAmount,
                monthly_rent: monthlyRent,
                signed_at: signedAt,
                status: ContractStatus.ACTIVE
            }
        });

        await tx.apartment.update({
            where: { id: apartmentId },
            data: { status: ApartmentStatus.RENTED }
        });

        await tx.invoice.create({
            data: {
                contract_id: contract.id,
                tenant_id: tenantId,
                invoice_code: `INV-${contract.id}-DEP`,
                total_amount: depositAmount,
                due_date: new Date(),
                status: "UNPAID"
            }
        });

        return contract;
    });
};

export const extendContractService = async (id: number, new_end_date: string) => {
    const contractId = toPositiveInteger(id, "Hợp đồng");
    const newEndDate = parseDate(new_end_date, "Ngày kết thúc mới");

    ensureEndDateIsValid(newEndDate);

    return await prisma.$transaction(async (tx) => {
        const existingContract = await tx.rentalContract.findUnique({
            where: { id: contractId },
            select: {
                id: true,
                end_date: true,
                status: true
            }
        });

        if (!existingContract) {
            throw new ContractError("Hợp đồng không tồn tại", 404);
        }

        if (existingContract.status !== ContractStatus.ACTIVE) {
            throw new ContractError("Chỉ có thể gia hạn hợp đồng đang hiệu lực");
        }

        if (newEndDate <= existingContract.end_date) {
            throw new ContractError("Ngày kết thúc mới phải lớn hơn ngày kết thúc hiện tại");
        }

        const updatedContract = await tx.rentalContract.update({
            where: { id: contractId },
            data: {
                end_date: newEndDate,
                extended_at: new Date()
            }
        });

        return {
            contract: updatedContract,
            old_end_date: existingContract.end_date
        };
    });
};

export const endContractService = async (
    id: number,
    actor: ContractActor,
    end_date?: unknown
) => {
    assertCanManageContracts(actor);

    const contractId = toPositiveInteger(id, "Hợp đồng");
    const actualEndDate = parseEndContractDate(end_date);
    const managerBuildingId = await requireManagerBuildingId(actor);

    return await prisma.$transaction(async (tx) => {
        const existingContract = await tx.rentalContract.findUnique({
            where: { id: contractId },
            include: {
                apartment: {
                    select: {
                        id: true,
                        building_id: true,
                        status: true,
                        room_number: true,
                        building: {
                            select: {
                                id: true,
                                branch_name: true
                            }
                        }
                    }
                },
                tenant: {
                    select: {
                        id: true,
                        full_name: true,
                        phone: true,
                        email: true
                    }
                }
            }
        });

        if (!existingContract) {
            throw new ContractError("Hợp đồng không tồn tại", 404);
        }

        if (managerBuildingId !== undefined && existingContract.apartment.building_id !== managerBuildingId) {
            throw new ContractError("Bạn không có quyền kết thúc hợp đồng của tòa nhà này", 403);
        }

        if (existingContract.status !== ContractStatus.ACTIVE) {
            throw new ContractError("Chỉ có thể kết thúc hợp đồng đang hiệu lực");
        }

        if (startOfDay(actualEndDate) < startOfDay(existingContract.start_date)) {
            throw new ContractError("Ngày kết thúc hợp đồng không thể nhỏ hơn ngày bắt đầu");
        }

        const endedContract = await tx.rentalContract.update({
            where: { id: contractId },
            data: {
                status: ContractStatus.ENDED,
                end_date: actualEndDate
            }
        });

        const remainingActiveContracts = await tx.rentalContract.count({
            where: {
                apartment_id: existingContract.apartment_id,
                status: ContractStatus.ACTIVE,
                id: { not: contractId }
            }
        });

        let apartmentStatus = existingContract.apartment.status;
        if (
            remainingActiveContracts === 0
            && existingContract.apartment.status === ApartmentStatus.RENTED
        ) {
            await tx.apartment.update({
                where: { id: existingContract.apartment_id },
                data: { status: ApartmentStatus.AVAILABLE }
            });
            apartmentStatus = ApartmentStatus.AVAILABLE;
        }

        const contract = await tx.rentalContract.findUniqueOrThrow({
            where: { id: contractId },
            include: {
                apartment: {
                    include: {
                        building: true
                    }
                },
                tenant: true
            }
        });

        return {
            contract,
            old_status: existingContract.status,
            new_status: endedContract.status,
            ended_at: actualEndDate,
            apartment_status: apartmentStatus
        };
    });
};
