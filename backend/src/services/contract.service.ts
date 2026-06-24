import { prisma } from "../config/database.js";

const toPositiveInteger = (value: unknown, fieldName: string) => {
    const numberValue = Number(value);

    if (!Number.isInteger(numberValue) || numberValue <= 0) {
        throw new Error(`${fieldName} không hợp lệ`);
    }

    return numberValue;
};

const toPositiveNumber = (value: unknown, fieldName: string) => {
    const numberValue = Number(value);

    if (!Number.isFinite(numberValue) || numberValue <= 0) {
        throw new Error(`${fieldName} phải lớn hơn 0`);
    }

    return numberValue;
};

const parseDate = (value: unknown, fieldName: string) => {
    if (typeof value !== "string" && !(value instanceof Date)) {
        throw new Error(`${fieldName} không hợp lệ`);
    }

    if (typeof value === "string" && value.trim() === "") {
        throw new Error(`${fieldName} không hợp lệ`);
    }

    const trimmedValue = value instanceof Date ? value : value.trim();
    const dateOnlyMatch = typeof trimmedValue === "string"
        ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmedValue)
        : null;

    const date = dateOnlyMatch
        ? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]))
        : new Date(trimmedValue);

    if (Number.isNaN(date.getTime())) {
        throw new Error(`${fieldName} không hợp lệ`);
    }

    if (
        dateOnlyMatch
        && (
            date.getFullYear() !== Number(dateOnlyMatch[1])
            || date.getMonth() !== Number(dateOnlyMatch[2]) - 1
            || date.getDate() !== Number(dateOnlyMatch[3])
        )
    ) {
        throw new Error(`${fieldName} không hợp lệ`);
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
        throw new Error("Ngày hết hạn không thể nhỏ hơn ngày hiện tại");
    }

    if (startDate && endDate <= startDate) {
        throw new Error("Ngày hết hạn phải lớn hơn ngày bắt đầu");
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
                    status: "ACTIVE"
                },
                select: { id: true }
            })
        ]);

        if (!apartment) {
            throw new Error("Căn hộ không tồn tại");
        }

        if (apartment.status !== "AVAILABLE") {
            throw new Error("Căn hộ không sẵn sàng để tạo hợp đồng");
        }

        if (!tenant) {
            throw new Error("Người thuê không tồn tại");
        }

        if (existingApartmentContract) {
            throw new Error("Căn hộ đang có hợp đồng hiệu lực");
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
                status: 'ACTIVE'
            }
        });

        await tx.apartment.update({
            where: { id: apartmentId },
            data: { status: "RENTED" }
        });

        await tx.invoice.create({
            data: {
                contract_id: contract.id,
                tenant_id: tenantId,
                invoice_code: `INV-${contract.id}-DEP`,
                total_amount: depositAmount,
                due_date: new Date(),
                status: 'UNPAID'
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
            throw new Error("Hợp đồng không tồn tại");
        }

        if (existingContract.status !== "ACTIVE") {
            throw new Error("Chỉ có thể gia hạn hợp đồng đang hiệu lực");
        }

        if (newEndDate <= existingContract.end_date) {
            throw new Error("Ngày kết thúc mới phải lớn hơn ngày kết thúc hiện tại");
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
