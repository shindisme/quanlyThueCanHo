import { ApartmentStatus, ContractStatus } from "@prisma/client";
import { prisma } from "../config/database.js";

export type ContractActor = {
    userId: number;
    role: string;
};

export class ContractError extends Error {
    statusCode: number;

    constructor(message: string, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
    }
}

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
