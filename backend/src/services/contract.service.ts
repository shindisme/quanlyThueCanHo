import {
    ApartmentStatus,
    ContractStatus,
    Prisma,
    Role,
    UserStatus
} from "@prisma/client";
import { prisma } from "../config/database.js";
import { AppError } from "../errors/app-error.js";
import type {
    CreateContractRequest,
    ListContractsRequest
} from "../schemas/contract.schema.js";
import type { Actor } from "../types/auth.js";
import {
    isNonNegativeDecimal12_2Amount,
    isPositiveDecimal12_2Amount
} from "../utils/money.js";
import {
    getCurrentManagerAssignment,
    getManagerTenantScope
} from "../utils/manager-scope.js";
import {
    buildFirstRentalInvoiceItems,
    sumBillingItems
} from "../utils/invoice-billing.js";
import { INITIAL_PASSWORD } from "./account.service.js";
import { buildTenantActivationUrl } from "./auth.service.js";
import { sendTenantActivationEmail } from "./mail.service.js";

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

const notFound = () => new AppError(
    404,
    "NOT_FOUND",
    "Hợp đồng không tồn tại"
);

const activeContractConflict = () => new AppError(
    409,
    "ACTIVE_CONTRACT_EXISTS",
    "Căn hộ này đã có hợp đồng đang hoạt động"
);

const contractNotActive = () => new AppError(
    409,
    "CONTRACT_NOT_ACTIVE",
    "Chỉ có thể thay đổi các hợp đồng đang hoạt động"
);

const concurrentModification = () => new AppError(
    409,
    "CONCURRENT_MODIFICATION",
    "Hợp đồng đã bị thay đổi trong quá trình thực hiện"
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

const isActiveContractUniqueConflict = (error: unknown) => {
    if (
        !(error instanceof Prisma.PrismaClientKnownRequestError)
        || error.code !== "P2002"
    ) {
        return false;
    }

    const target = error.meta?.target;

    return target === "rental_contracts_one_active_per_apartment_key"
        || Array.isArray(target)
        && target.length === 1
        && target[0] === "apartment_id";
};

const normalizeCreatedContract = <
    T extends {
        deposit_amount: Prisma.Decimal | number;
        monthly_rent: Prisma.Decimal | number;
    }
>(contract: T) => ({
    ...contract,
    deposit_amount: Number(contract.deposit_amount),
    monthly_rent: Number(contract.monthly_rent)
});

const normalizeContract = (contract: ContractWithRelations) => ({
    ...normalizeCreatedContract(contract),
    apartment: {
        ...contract.apartment,
        area: Number(contract.apartment.area),
        rental_price: Number(contract.apartment.rental_price)
    }
});



const getContractScope = (
    actor: Actor
) => {
    if (actor.role === Role.ADMIN) {
        return {} as const;
    }

    if (actor.role === Role.MANAGER) {
        const {
            buildingId,
            assignmentWhere
        } = getCurrentManagerAssignment(actor);

        return {
            apartment: {
                building_id: buildingId,
                building: assignmentWhere
            }
        } satisfies Prisma.RentalContractWhereInput;
    }

    if (actor.role === Role.TENANT) {
        if (actor.tenantId === undefined) {
            throw new AppError(
                403,
                "TENANT_PROFILE_REQUIRED",
                "Yêu cầu phải có hồ sơ khách thuê"
            );
        }

        return {
            tenant_id: actor.tenantId
        } satisfies Prisma.RentalContractWhereInput;
    }

    throw new AppError(
        403,
        "FORBIDDEN",
        "Bạn không có quyền truy cập hợp đồng"
    );
};

const throwContractMutationConflict = async (
    transaction: Prisma.TransactionClient,
    id: number,
    scope: Prisma.RentalContractWhereInput
): Promise<never> => {
    const current = await transaction.rentalContract.findFirst({
        where: {
            id,
            ...scope
        },
        select: {
            id: true,
            status: true,
            end_date: true
        }
    });

    if (!current) {
        throw notFound();
    }

    if (current.status !== ContractStatus.ACTIVE) {
        throw contractNotActive();
    }

    throw concurrentModification();
};

const padMonth = (month: number) => month.toString().padStart(2, "0");

const buildFirstInvoiceCode = (contractId: number, startDate: Date) =>
    `INV-${contractId}-${startDate.getUTCFullYear()}${padMonth(startDate.getUTCMonth() + 1)}`;

const startOfDay = (date: Date) => {
    const result = new Date(date);
    result.setUTCHours(0, 0, 0, 0);
    return result;
};

const ensureNewEndDate = (
    endDate: Date,
    currentEndDate?: Date
) => {
    if (startOfDay(endDate) < startOfDay(new Date())) {
        throw new AppError(
            400,
            "INVALID_DATE_RANGE",
            "Ngày kết thúc hợp đồng không thể nhỏ hơn ngày hiện tại"
        );
    }

    if (currentEndDate && endDate <= currentEndDate) {
        throw new AppError(
            400,
            "INVALID_DATE_RANGE",
            "Ngày kết thúc mới phải sau ngày kết thúc hiện tại"
        );
    }
};

const assertPositiveMoney = (
    value: number,
    field: "deposit_amount" | "monthly_rent"
) => {
    if (!isPositiveDecimal12_2Amount(value)) {
        throw new AppError(
            400,
            "VALIDATION_ERROR",
            `${field} phải là số dương, đúng định dạng Decimal(12,2) và tối đa 2 chữ số thập phân`
        );
    }
};

const assertInvoiceMoney = (value: number) => {
    if (!isNonNegativeDecimal12_2Amount(value)) {
        throw new AppError(
            400,
            "VALIDATION_ERROR",
            "Tổng tiền hóa đơn phải đúng định dạng Decimal(12,2)"
        );
    }
};

export const getContractsService = async (
    filters: ListContractsRequest["query"],
    actor: Actor
) => {
    const actorScope = getContractScope(actor);

    if (
        actor.role === Role.MANAGER
        && filters.building_id !== undefined
        && filters.building_id !== actor.buildingId
    ) {
        throw notFound();
    }

    const conditions: Prisma.RentalContractWhereInput[] = [
        actorScope
    ];

    if (filters.status !== undefined) {
        conditions.push({ status: filters.status });
    }

    if (filters.tenant_id !== undefined) {
        conditions.push({ tenant_id: filters.tenant_id });
    }

    if (filters.apartment_id !== undefined) {
        conditions.push({ apartment_id: filters.apartment_id });
    }

    if (filters.building_id !== undefined) {
        conditions.push({
            apartment: {
                building_id: filters.building_id
            }
        });
    }

    if (filters.search !== undefined) {
        const idText = filters.search
            .replace(/^HD-?/i, "")
            .replace(/^0+/, "") || "0";
        const id = Number(idText);
        const searchConditions: Prisma.RentalContractWhereInput[] = [
            {
                tenant: {
                    full_name: {
                        contains: filters.search,
                        mode: "insensitive"
                    }
                }
            },
            { tenant: { phone: { contains: filters.search } } },
            {
                tenant: {
                    email: {
                        contains: filters.search,
                        mode: "insensitive"
                    }
                }
            },
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
            }
        ];

        if (Number.isInteger(id) && id > 0) {
            searchConditions.push({ id });
        }

        conditions.push({ OR: searchConditions });
    }

    const where: Prisma.RentalContractWhereInput = {
        AND: conditions
    };
    const [contracts, total] = await prisma.$transaction([
        prisma.rentalContract.findMany({
            where,
            skip: (filters.page - 1) * filters.limit,
            take: filters.limit,
            orderBy: { created_at: "desc" },
            include: contractInclude
        }),
        prisma.rentalContract.count({ where })
    ]);

    return {
        data: contracts.map(normalizeContract),
        pagination: {
            page: filters.page,
            limit: filters.limit,
            total,
            totalPages: Math.ceil(total / filters.limit)
        }
    };
};

export const getContractByIdService = async (
    id: number,
    actor: Actor
) => {
    const contract = await prisma.rentalContract.findFirst({
        where: {
            id,
            ...getContractScope(actor)
        },
        include: contractInclude
    });

    if (!contract) {
        throw notFound();
    }

    return normalizeContract(contract);
};

export const createContractService = async (
    input: CreateContractRequest["body"],
    actor: Actor
) => {
    assertPositiveMoney(
        input.deposit_amount,
        "deposit_amount"
    );
    assertPositiveMoney(
        input.monthly_rent,
        "monthly_rent"
    );

    const managerAssignment = actor.role === Role.MANAGER
        ? getCurrentManagerAssignment(actor)
        : undefined;

    ensureNewEndDate(input.end_date);

    try {
        const result = await runSerializableTransaction(async (transaction) => {
            const apartmentScope: Prisma.ApartmentWhereInput = {
                id: input.apartment_id,
                ...(managerAssignment
                    ? {
                        building_id: managerAssignment.buildingId,
                        building: managerAssignment.assignmentWhere
                    }
                    : {})
            };
            const tenantScope: Prisma.TenantWhereInput = {
                id: input.tenant_id,
                ...(managerAssignment
                    ? getManagerTenantScope(actor)
                    : {})
            };
            const [apartment, tenant] = await Promise.all([
                transaction.apartment.findFirst({
                    where: apartmentScope,
                    select: {
                        id: true,
                        building_id: true,
                        status: true,
                        area: true
                    }
                }),
                transaction.tenant.findFirst({
                    where: tenantScope,
                    select: {
                        id: true,
                        full_name: true,
                        email: true,
                        onboarding_building_id: true,
                        user_id: true,
                        user: {
                            select: {
                                id: true,
                                username: true,
                                status: true
                            }
                        }
                    }
                })
            ]);

            if (!apartment || !tenant) {
                throw new AppError(
                    404,
                    "NOT_FOUND",
                    "Căn hộ hoặc khách thuê không tồn tại"
                );
            }

            if (apartment.status !== ApartmentStatus.AVAILABLE) {
                throw new AppError(
                    409,
                    "APARTMENT_UNAVAILABLE",
                    "Căn hộ không có sẵn"
                );
            }

            const existingContract =
                await transaction.rentalContract.findFirst({
                    where: {
                        apartment_id: apartment.id,
                        status: ContractStatus.ACTIVE
                    },
                    select: { id: true }
                });

            if (existingContract) {
                throw activeContractConflict();
            }

            const apartmentConnect:
                Prisma.ApartmentWhereUniqueInput = {
                id: apartment.id,
                status: ApartmentStatus.AVAILABLE,
                contracts: {
                    none: { status: ContractStatus.ACTIVE }
                },
                ...(managerAssignment
                    ? {
                        building_id: managerAssignment.buildingId,
                        building:
                            managerAssignment.assignmentWhere
                    }
                    : {})
            };
            const tenantConnect: Prisma.TenantWhereUniqueInput = {
                ...(managerAssignment
                    ? getManagerTenantScope(actor)
                    : {}),
                id: tenant.id
            };
            const contract = await transaction.rentalContract.create({
                data: {
                    apartment: { connect: apartmentConnect },
                    tenant: { connect: tenantConnect },
                    start_date: input.start_date,
                    end_date: input.end_date,
                    deposit_amount: input.deposit_amount,
                    monthly_rent: input.monthly_rent,
                    signed_at: input.signed_at,
                    contract_file: input.contract_file,
                    status: ContractStatus.ACTIVE
                }
            });

            await transaction.apartment.update({
                where: {
                    id: apartment.id,
                    status: ApartmentStatus.AVAILABLE,
                    ...(managerAssignment
                        ? {
                            building_id: managerAssignment.buildingId,
                            building:
                                managerAssignment.assignmentWhere
                        }
                        : {})
                },
                data: { status: ApartmentStatus.RENTED }
            });

            const firstInvoiceItems = buildFirstRentalInvoiceItems({
                depositAmount: input.deposit_amount,
                monthlyRent: input.monthly_rent,
                area: apartment.area
            });
            const firstInvoiceTotal = sumBillingItems(firstInvoiceItems);
            assertInvoiceMoney(firstInvoiceTotal);

            const firstInvoiceCode = buildFirstInvoiceCode(
                contract.id,
                input.start_date
            );
            await transaction.invoice.create({
                data: {
                    contract_id: contract.id,
                    tenant_id: tenant.id,
                    invoice_code: firstInvoiceCode,
                    total_amount: firstInvoiceTotal,
                    due_date: new Date(),
                    status: "UNPAID",
                    items: {
                        create: firstInvoiceItems
                    }
                }
            });

            if (tenant.user_id) {
                await transaction.notification.create({
                    data: {
                        user_id: tenant.user_id,
                        title: "Hóa đơn mới",
                        content: "Hóa đơn " + firstInvoiceCode + " đã được tạo với tổng tiền " + firstInvoiceTotal + ".",
                        type: "INVOICE_CREATED"
                    }
                });
                await transaction.user.updateMany({
                    where: {
                        id: tenant.user_id,
                        status: UserStatus.BANNED
                    },
                    data: { status: UserStatus.ACTIVE }
                });
            }

            if (
                tenant.onboarding_building_id
                === apartment.building_id
            ) {
                await transaction.tenant.updateMany({
                    where: {
                        id: tenant.id,
                        onboarding_building_id: apartment.building_id,
                        ...(managerAssignment
                            ? {
                                onboarding_building:
                                    managerAssignment.assignmentWhere
                            }
                            : {})
                    },
                    data: { onboarding_building_id: null }
                });
            }

            const activationEmailData =
                tenant.user?.status === UserStatus.INACTIVE && tenant.email
                    ? {
                        to: tenant.email,
                        tenantName: tenant.full_name,
                        username: tenant.user.username,
                        initialPassword: INITIAL_PASSWORD,
                        activationUrl: buildTenantActivationUrl(tenant.user.id)
                    }
                    : null;

            return {
                contract: normalizeCreatedContract(contract),
                activationEmailData
            };
        });

        if (result.activationEmailData) {
            try {
                await sendTenantActivationEmail(result.activationEmailData);
            } catch {
                // Email lỗi không được làm rollback hợp đồng đã tạo thành công.
            }
        }

        return result.contract;
    } catch (error) {
        if (isActiveContractUniqueConflict(error)) {
            throw activeContractConflict();
        }

        throw error;
    }
};

export const extendContractService = async (
    id: number,
    newEndDate: Date,
    actor: Actor
) => runSerializableTransaction(async (transaction) => {
    const scope = getContractScope(actor);
    const existing = await transaction.rentalContract.findFirst({
        where: {
            ...scope,
            id
        },
        select: {
            id: true,
            end_date: true,
            status: true
        }
    });

    if (!existing) {
        throw notFound();
    }

    if (existing.status !== ContractStatus.ACTIVE) {
        throw contractNotActive();
    }

    ensureNewEndDate(newEndDate, existing.end_date);
    const updated = await transaction.rentalContract.updateMany({
        where: {
            ...scope,
            id,
            status: ContractStatus.ACTIVE,
            end_date: existing.end_date
        },
        data: {
            end_date: newEndDate,
            extended_at: new Date()
        }
    });

    if (updated.count === 0) {
        await throwContractMutationConflict(transaction, id, scope);
    }

    const contract = await transaction.rentalContract.findFirst({
        where: {
            id,
            ...scope
        },
        select: {
            id: true,
            end_date: true,
            extended_at: true
        }
    });

    if (!contract) {
        throw notFound();
    }

    return {
        contract,
        old_end_date: existing.end_date
    };
});

export const endContractService = async (
    id: number,
    actor: Actor,
    requestedEndDate?: Date
) => runSerializableTransaction(async (transaction) => {
    const scope = getContractScope(actor);
    const endDate = requestedEndDate ?? new Date();
    const existing = await transaction.rentalContract.findFirst({
        where: {
            id,
            ...scope
        },
        include: contractInclude
    });

    if (!existing) {
        throw notFound();
    }

    if (existing.status !== ContractStatus.ACTIVE) {
        throw contractNotActive();
    }

    if (startOfDay(endDate) > startOfDay(new Date())) {
        throw new AppError(
            400,
            "INVALID_DATE_RANGE",
            "Hợp đồng không thể kết thúc ở tương lai"
        );
    }

    if (startOfDay(endDate) < startOfDay(existing.start_date)) {
        throw new AppError(
            400,
            "INVALID_DATE_RANGE",
            "Hợp đồng không thể kết thúc trước ngày bắt đầu"
        );
    }

    const ended = await transaction.rentalContract.updateMany({
        where: {
            id,
            ...scope,
            status: ContractStatus.ACTIVE
        },
        data: {
            status: ContractStatus.ENDED,
            end_date: endDate
        }
    });

    if (ended.count === 0) {
        await throwContractMutationConflict(transaction, id, scope);
    }

    const remainingActiveContracts =
        await transaction.rentalContract.count({
            where: {
                apartment_id: existing.apartment_id,
                status: ContractStatus.ACTIVE,
                id: { not: id }
            }
        });
    let apartmentStatus = existing.apartment.status;

    if (
        remainingActiveContracts === 0
        && apartmentStatus === ApartmentStatus.RENTED
    ) {
        const managerAssignment = actor.role === Role.MANAGER
            ? getCurrentManagerAssignment(actor)
            : undefined;

        const apartmentScope: Prisma.ApartmentWhereInput = {
            id: existing.apartment_id,
            ...(managerAssignment
                ? {
                    building_id: managerAssignment.buildingId,
                    building: managerAssignment.assignmentWhere
                }
                : {})
        };
        const released = await transaction.apartment.updateMany({
            where: {
                ...apartmentScope,
                status: ApartmentStatus.RENTED
            },
            data: { status: ApartmentStatus.AVAILABLE }
        });

        if (released.count === 1) {
            apartmentStatus = ApartmentStatus.AVAILABLE;
        } else {
            const apartment = await transaction.apartment.findFirst({
                where: apartmentScope,
                select: { status: true }
            });

            if (!apartment) {
                throw notFound();
            }

            apartmentStatus = apartment.status;
        }
    }

    const contract = await transaction.rentalContract.findFirst({
        where: {
            id,
            ...scope
        },
        include: contractInclude
    });

    if (!contract) {
        throw notFound();
    }

    return {
        contract: normalizeContract(contract),
        old_status: existing.status,
        new_status: ContractStatus.ENDED,
        ended_at: endDate,
        apartment_status: apartmentStatus
    };
});
