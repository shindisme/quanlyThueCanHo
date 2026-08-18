import {
    ApartmentStatus,
    ContractStatus,
    InvoiceType,
    Prisma,
    ReservationStatus,
    Role,
    UserStatus
} from "@prisma/client";
import { prisma } from "../config/database.js";
import { INITIAL_PASSWORD } from "./account.service.js";
import { buildTenantActivationUrl } from "./auth.service.js";
import { sendTenantActivationEmail } from "./mail.service.js";
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
import { runSerializableTransaction } from "../utils/prisma-transaction.js";

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

const sendActivationEmailAfterContractCreation = async (
    tenant: {
        email: string | null;
        full_name: string;
        user: {
            id: number;
            username: string;
            status: UserStatus;
        } | null;
    }
) => {
    if (
        tenant.email === null
        || tenant.user === null
        || tenant.user.status !== UserStatus.INACTIVE
    ) {
        return;
    }

    try {
        await sendTenantActivationEmail({
            to: tenant.email,
            tenantName: tenant.full_name,
            username: tenant.user.username,
            initialPassword: INITIAL_PASSWORD,
            activationUrl: buildTenantActivationUrl(tenant.user.id)
        });
    } catch {
        // Email lỗi không được làm rollback hợp đồng đã tạo.
    }
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
        input.monthly_rent,
        "monthly_rent"
    );

    const managerAssignment = actor.role === Role.MANAGER
        ? getCurrentManagerAssignment(actor)
        : undefined;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    if (new Date(input.start_date) < startOfToday) {
        throw new AppError(
            400,
            "INVALID_DATE_RANGE",
            "Ngày bắt đầu hợp đồng không thể nhỏ hơn ngày hiện tại"
        );
    }

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

            if (apartment.status !== ApartmentStatus.RESERVED) {
                throw new AppError(
                    409,
                    "RESERVATION_REQUIRED",
                    "Chỉ có thể lập hợp đồng từ căn hộ đã được đặt cọc"
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

            const reservation = await transaction.reservation.findFirst({
                where: {
                    apartment_id: apartment.id,
                    tenant_id: tenant.id,
                    status: ReservationStatus.ACTIVE
                },
                select: { id: true, deposit_amount: true }
            });

            if (!reservation) {
                throw new AppError(
                    409,
                    "RESERVATION_NOT_FOUND",
                    "Căn hộ đã được giữ chỗ cho người thuê khác hoặc chưa có đặt cọc"
                );
            }

            const depositAmount = Number(reservation.deposit_amount);
            await transaction.reservation.update({
                where: { id: reservation.id },
                data: { status: ReservationStatus.CONVERTED }
            });

            assertPositiveMoney(depositAmount, "deposit_amount");

            const apartmentConnect:
                Prisma.ApartmentWhereUniqueInput = {
                id: apartment.id,
                status: apartment.status,
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
                    deposit_amount: depositAmount,
                    monthly_rent: input.monthly_rent,
                    signed_at: input.signed_at ?? input.start_date,
                    contract_file: input.contract_file,
                    status: ContractStatus.ACTIVE
                }
            });

            await transaction.apartment.update({
                where: {
                    id: apartment.id,
                    status: apartment.status,
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

            if (reservation) {
                const convertedReservation = await transaction.reservation.updateMany({
                    where: {
                        id: reservation.id,
                        status: ReservationStatus.ACTIVE
                    },
                    data: {
                        status: ReservationStatus.CONVERTED,
                        contract_id: contract.id
                    }
                });

                if (convertedReservation.count === 0) {
                    throw concurrentModification();
                }
            }
            const firstInvoiceItems = buildFirstRentalInvoiceItems({
                depositAmount,
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
                    type: InvoiceType.FIRST_RENT,
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

            return {
                contract: normalizeCreatedContract(contract),
                tenant
            };
        }, concurrentModification);

        await sendActivationEmailAfterContractCreation(result.tenant);

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
}, concurrentModification);

export const endContractService = async (
    _id: number,
    _actor: Actor,
    _requestedEndDate?: Date
): Promise<never> => {
    throw new AppError(
        410,
        "TERMINATION_WORKFLOW_REQUIRED",
        "Endpoint kết thúc hợp đồng trực tiếp đã ngừng dùng. Vui lòng sử dụng quy trình thanh lý hợp đồng."
    );
};
