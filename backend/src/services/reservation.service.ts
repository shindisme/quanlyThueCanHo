import {
    ApartmentStatus,
    ContractStatus,
    InvoiceStatus,
    InvoiceType,
    PaymentStatus,
    Prisma,
    ReservationStatus,
    Role,
    UserStatus
} from "@prisma/client";
import { prisma } from "../config/database.js";
import { AppError } from "../errors/app-error.js";
import { getManagerApartmentScope } from "../utils/manager-scope.js";
import type {
    CreateReservationRequest,
    ListReservationsRequest
} from "../schemas/reservation.schema.js";
import type { Actor } from "../types/auth.js";
import { createInitialCredential, tenantUsername } from "./account.service.js";
import {
    sendReservationDepositPaidEmail,
    sendReservationDepositPaymentEmail,
    sendReservationExpiredEmail
} from "./mail.service.js";
import { buildDepositPaymentUrl } from "./payment.service.js";
import { runSerializableTransaction } from "../utils/prisma-transaction.js";
import {
    getReservationDepositBlockReason,
    type ReservationDepositBlockReason
} from "../utils/reservation-deposit.rules.js";

type CreateReservationInput = CreateReservationRequest["body"];
type ListReservationsInput = ListReservationsRequest["query"];

type CreatedTenantUser = {
    id: number;
    username: string;
    role: Role;
    status: UserStatus;
    created_at: Date;
};

const TENANT_USERNAME_RETRY_LIMIT = 3;

const apartmentUnavailable = () => new AppError(
    409,
    "APARTMENT_UNAVAILABLE",
    "Căn hộ không có sẵn để đặt cọc"
);

const reservationConcurrentModification = () => new AppError(
    409,
    "CONCURRENT_MODIFICATION",
    "Đặt cọc đã bị thay đổi trong quá trình thực hiện"
);

const tenantNotFound = () => new AppError(
    404,
    "TENANT_NOT_FOUND",
    "Người thuê không tồn tại"
);

const tenantActiveContractExists = (tenantName?: string) => new AppError(
    409,
    "TENANT_ACTIVE_CONTRACT_EXISTS",
    tenantName
        ? `Người thuê "${tenantName}" đang có hợp đồng thuê phòng khác còn hiệu lực`
        : "Người thuê đang có hợp đồng hoạt động"
);

const tenantActiveReservationExists = (tenantName?: string) => new AppError(
    409,
    "TENANT_ACTIVE_RESERVATION_EXISTS",
    tenantName
        ? `Người thuê "${tenantName}" đang có đơn đặt cọc phòng khác đang chờ nhận phòng`
        : "Người thuê đang có đặt cọc hoạt động"
);

const tenantExists = (message?: string) => new AppError(
    409,
    "TENANT_EXISTS",
    message || "Thông tin người thuê đã tồn tại trong hệ thống"
);

const reservationDepositBlockError = (
    reason: ReservationDepositBlockReason,
    tenantName?: string
) => {
    if (reason === "ACTIVE_CONTRACT") {
        return tenantActiveContractExists(tenantName);
    }

    if (reason === "ACTIVE_RESERVATION") {
        return tenantActiveReservationExists(tenantName);
    }

    return tenantExists();
};

const assertCanManageReservations = (actor: Actor) => {
    if (actor.role !== Role.ADMIN && actor.role !== Role.MANAGER) {
        throw new AppError(
            403,
            "FORBIDDEN",
            "Bạn không có quyền quản lý đặt cọc"
        );
    }
};

const isUsernameUniqueConflict = (error: unknown) => {
    if (
        !(error instanceof Prisma.PrismaClientKnownRequestError)
        || error.code !== "P2002"
    ) {
        return false;
    }

    const target = error.meta?.target;

    return target === "users_username_key"
        || Array.isArray(target)
        && target.length === 1
        && target[0] === "username";
};

const firstAvailableTenantUsername = (
    base: string,
    existing: { username: string }[]
) => {
    const usernames = new Set(
        existing.map(({ username }) => username)
    );

    if (!usernames.has(base)) {
        return base;
    }

    let suffix = 2;
    while (usernames.has(`${base}_${suffix}`)) {
        suffix += 1;
    }

    return `${base}_${suffix}`;
};

const reservationSelect = {
    id: true,
    apartment_id: true,
    tenant_id: true,
    contract_id: true,
    deposit_amount: true,
    reserved_at: true,
    expires_at: true,
    status: true,
    created_at: true
} satisfies Prisma.ReservationSelect;

const depositTenantSelect = {
    id: true,
    user_id: true,
    full_name: true,
    phone: true,
    email: true,
    date_of_birth: true,
    citizen_id: true,
    address: true,
    is_verified: true,
    created_at: true,
    contracts: {
        where: { status: ContractStatus.ACTIVE },
        select: { id: true },
        take: 1
    },
    reservations: {
        where: { status: ReservationStatus.ACTIVE },
        select: { id: true },
        take: 1
    }
} satisfies Prisma.TenantSelect;

type DepositTenant = Prisma.TenantGetPayload<{
    select: typeof depositTenantSelect;
}>;

const normalizeDepositTenant = (tenant: DepositTenant) => {
    const {
        contracts: _contracts,
        reservations: _reservations,
        ...normalizedTenant
    } = tenant;

    return normalizedTenant;
};

const reservationInclude = {
    tenant: {
        select: {
            id: true,
            user_id: true,
            full_name: true,
            phone: true,
            email: true,
            citizen_id: true,
            address: true,
            date_of_birth: true,
            is_verified: true,
            user: {
                select: {
                    username: true,
                    role: true,
                    status: true
                }
            }
        }
    },
    apartment: {
        select: {
            id: true,
            building_id: true,
            floor: true,
            room_number: true,
            status: true,
            building: {
                select: {
                    id: true,
                    branch_name: true,
                    address: true
                }
            }
        }
    },
    invoices: {
        select: {
            id: true,
            invoice_code: true,
            total_amount: true,
            status: true,
            due_date: true,
            paid_at: true,
            type: true
        }
    }
} satisfies Prisma.ReservationInclude;

type ReservationWithRelations = Prisma.ReservationGetPayload<{
    include: typeof reservationInclude;
}>;

const normalizeReservation = (
    reservation: ReservationWithRelations
) => ({
    ...reservation,
    deposit_amount: Number(reservation.deposit_amount)
});

export const autoExpireReservations = async () => {
    const now = new Date();

    try {
        const expired = await prisma.reservation.findMany({
            where: {
                status: ReservationStatus.ACTIVE,
                expires_at: { lt: now },
                contract_id: null
            },
            select: {
                id: true,
                apartment_id: true,
                expires_at: true,
                tenant: {
                    select: {
                        full_name: true,
                        email: true
                    }
                },
                apartment: {
                    select: {
                        room_number: true,
                        floor: true,
                        building: {
                            select: {
                                address: true
                            }
                        }
                    }
                }
            }
        });

        for (const res of expired) {
            await prisma.reservation.updateMany({
                where: {
                    id: res.id,
                    status: ReservationStatus.ACTIVE,
                    contract_id: null
                },
                data: { status: ReservationStatus.FORFEITED }
            });
            await prisma.apartment.updateMany({
                where: {
                    id: res.apartment_id,
                    status: ApartmentStatus.RESERVED
                },
                data: { status: ApartmentStatus.AVAILABLE }
            });
            sendReservationExpiredNotice(res).catch(() => { });
        }

        const activeReservations = await prisma.reservation.findMany({
            where: {
                status: ReservationStatus.ACTIVE,
                expires_at: { gte: now },
                contract_id: null
            },
            select: { apartment_id: true }
        });
        const activeApartmentIds = activeReservations.map((r) => r.apartment_id);

        await prisma.apartment.updateMany({
            where: {
                status: ApartmentStatus.RESERVED,
                ...(activeApartmentIds.length > 0
                    ? { id: { notIn: activeApartmentIds } }
                    : {})
            },
            data: { status: ApartmentStatus.AVAILABLE }
        });
    } catch {

    }
};

const invoiceInclude = {
    items: true
} satisfies Prisma.InvoiceInclude;

const formatApartmentLabel = (
    apartment: {
        room_number: string;
        floor: number;
    }
) => `P.${apartment.room_number} - Tầng ${apartment.floor}`;

const sendReservationExpiredNotice = async (
    data: {
        expires_at: Date;
        tenant?: {
            email: string | null;
            full_name: string;
        } | null;
        apartment?: {
            room_number: string;
            floor: number;
            building?: {
                address: string;
            } | null;
        } | null;
    }
) => {
    if (!data.tenant?.email || !data.apartment) {
        return;
    }

    try {
        await sendReservationExpiredEmail({
            to: data.tenant.email,
            tenantName: data.tenant.full_name,
            apartmentLabel: formatApartmentLabel(data.apartment),
            buildingAddress: data.apartment.building?.address || "",
            moveInDeadline: data.expires_at
        });
    } catch {
        // Email lỗi không được làm rollback xử lý bỏ cọc.
    }
};

export const getReservationsService = async (
    input: ListReservationsInput,
    actor: Actor
) => {
    assertCanManageReservations(actor);
    await autoExpireReservations();

    const page = input.page ?? 1;
    const limit = input.limit ?? 10;
    const skip = (page - 1) * limit;
    const where: Prisma.ReservationWhereInput = {};

    if (input.status !== undefined) {
        where.status = input.status;
    }

    if (input.tenant_id !== undefined) {
        where.tenant_id = input.tenant_id;
    }

    if (input.apartment_id !== undefined) {
        where.apartment_id = input.apartment_id;
    }

    if (actor.role === Role.MANAGER) {
        where.apartment = getManagerApartmentScope(actor);
    }

    const [reservations, total] = await Promise.all([
        prisma.reservation.findMany({
            where,
            skip,
            take: limit,
            orderBy: [
                { created_at: "desc" },
                { id: "desc" }
            ],
            include: reservationInclude
        }),
        prisma.reservation.count({ where })
    ]);

    return {
        data: reservations.map(normalizeReservation),
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
};

export const createReservationDepositService = async (
    input: CreateReservationInput,
    actor: Actor
) => {
    assertCanManageReservations(actor);

    const tenantPayload = "tenant" in input ? input.tenant : undefined;
    const existingTenantId = "tenant_id" in input
        ? input.tenant_id
        : undefined;
    const usernameBase = tenantPayload
        ? tenantUsername(tenantPayload.citizen_id)
        : null;

    for (
        let attempt = 1;
        attempt <= TENANT_USERNAME_RETRY_LIMIT;
        attempt += 1
    ) {
        try {
            const result = await runSerializableTransaction(async (tx) => {
                const apartment = await tx.apartment.findFirst({
                    where: {
                        id: input.apartment_id,
                        status: ApartmentStatus.AVAILABLE
                    },
                    select: {
                        id: true,
                        rental_price: true,
                        status: true,
                        floor: true,
                        room_number: true,
                        building: {
                            select: {
                                branch_name: true,
                                address: true
                            }
                        }
                    }
                });

                if (!apartment) {
                    throw apartmentUnavailable();
                }

                let tenant: DepositTenant | null = null;
                let user: CreatedTenantUser | null = null;
                let initialPassword: string | null = null;

                if (tenantPayload) {
                    const existingByCitizenId = await tx.tenant.findFirst({
                        where: {
                            citizen_id: tenantPayload.citizen_id
                        },
                        select: {
                            id: true,
                            full_name: true,
                            citizen_id: true
                        }
                    });

                    if (existingByCitizenId) {
                        throw new AppError(
                            409,
                            "TENANT_CITIZEN_ID_EXISTS",
                            `Số CCCD/CMND "${tenantPayload.citizen_id}" đã tồn tại trong hệ thống.`
                        );
                    }

                    if (tenantPayload.phone) {
                        const existingByPhone = await tx.tenant.findFirst({
                            where: {
                                phone: tenantPayload.phone
                            },
                            select: {
                                id: true,
                                full_name: true,
                                phone: true
                            }
                        });

                        if (existingByPhone) {
                            throw new AppError(
                                409,
                                "TENANT_PHONE_EXISTS",
                                `Số điện thoại "${tenantPayload.phone}" đã tồn tại trong hệ thống.`
                            );
                        }
                    }

                    if (tenantPayload.email) {
                        const existingByEmail = await tx.tenant.findFirst({
                            where: {
                                email: tenantPayload.email
                            },
                            select: {
                                id: true,
                                full_name: true,
                                email: true
                            }
                        });

                        if (existingByEmail) {
                            throw new AppError(
                                409,
                                "TENANT_EMAIL_EXISTS",
                                `Email "${tenantPayload.email}" đã tồn tại trong hệ thống.`
                            );
                        }
                    }

                    if (!usernameBase) {
                        throw new Error("Tenant username unavailable");
                    }

                    const credential = await createInitialCredential();
                    const existingUsers = await tx.user.findMany({
                        where: {
                            username: {
                                startsWith: usernameBase
                            }
                        },
                        select: { username: true }
                    });
                    const username = firstAvailableTenantUsername(
                        usernameBase,
                        existingUsers
                    );
                    user = await tx.user.create({
                        data: {
                            username,
                            password_hash: credential.password_hash,
                            role: Role.TENANT,
                            status: UserStatus.INACTIVE
                        },
                        select: {
                            id: true,
                            username: true,
                            role: true,
                            status: true,
                            created_at: true
                        }
                    });
                    tenant = await tx.tenant.create({
                        data: {
                            ...tenantPayload,
                            is_verified: false,
                            user: {
                                connect: { id: user.id }
                            }
                        },
                        select: depositTenantSelect
                    });
                    initialPassword = credential.initial_password;
                } else if (existingTenantId) {
                    tenant = await tx.tenant.findFirst({
                        where: {
                            id: existingTenantId
                        },
                        select: depositTenantSelect
                    });

                    if (!tenant) {
                        throw tenantNotFound();
                    }

                    const blockReason = getReservationDepositBlockReason({
                        isNewTenantPayload: false,
                        tenantExists: true,
                        hasActiveContract: tenant.contracts.length > 0,
                        hasActiveReservation: tenant.reservations.length > 0
                    });

                    if (blockReason) {
                        throw reservationDepositBlockError(blockReason, tenant.full_name);
                    }
                } else {
                    throw tenantNotFound();
                }

                if (!tenant) {
                    throw tenantNotFound();
                }

                const reservedApartment = await tx.apartment.updateMany({
                    where: {
                        id: apartment.id,
                        status: ApartmentStatus.AVAILABLE
                    },
                    data: { status: ApartmentStatus.RESERVED }
                });

                if (reservedApartment.count === 0) {
                    throw apartmentUnavailable();
                }

                const now = new Date();
                const reservation = await tx.reservation.create({
                    data: {
                        apartment_id: apartment.id,
                        tenant_id: tenant.id,
                        deposit_amount: input.deposit_amount,
                        status: ReservationStatus.ACTIVE,
                        expires_at: input.move_in_date
                    },
                    select: reservationSelect
                });
                const invoice = await tx.invoice.create({
                    data: {
                        tenant_id: tenant.id,
                        reservation_id: reservation.id,
                        type: InvoiceType.DEPOSIT,
                        invoice_code: `DEP-${reservation.id}`,
                        due_date: now,
                        total_amount: input.deposit_amount,
                        status: input.payment_method === "CASH"
                            ? InvoiceStatus.PAID
                            : InvoiceStatus.UNPAID,
                        paid_at: input.payment_method === "CASH" ? now : null,
                        items: {
                            create: [
                                {
                                    item_name: "Tiền cọc",
                                    quantity: 1,
                                    unit_price: input.deposit_amount,
                                    amount: input.deposit_amount
                                }
                            ]
                        }
                    },
                    include: invoiceInclude
                });

                const payment = input.payment_method === "CASH"
                    ? await tx.payment.create({
                        data: {
                            invoice_id: invoice.id,
                            payment_method: "CASH",
                            amount: input.deposit_amount,
                            status: PaymentStatus.SUCCESS,
                            paid_at: now
                        }
                    })
                    : null;

                return {
                    reservation,
                    invoice,
                    tenant: normalizeDepositTenant(tenant),
                    user,
                    payment,
                    initial_password: initialPassword,
                    apartment
                };
            }, reservationConcurrentModification);

            const { apartment: _apartment, ...response } = result;

            try {
                if (!result.tenant.email) {
                    return response;
                }

                const emailData = {
                    to: result.tenant.email,
                    tenantName: result.tenant.full_name,
                    invoiceCode: result.invoice.invoice_code,
                    depositAmount: Number(result.invoice.total_amount),
                    apartmentLabel: formatApartmentLabel(result.apartment),
                    buildingAddress: result.apartment.building.address,
                    moveInDeadline: result.reservation.expires_at
                };

                if (input.payment_method === "CASH") {
                    await sendReservationDepositPaidEmail(emailData);
                } else {
                    await sendReservationDepositPaymentEmail({
                        ...emailData,
                        paymentUrl: buildDepositPaymentUrl(result.invoice.id)
                    });
                }
            } catch {
                // Email lỗi không được làm rollback dữ liệu đặt cọc đã tạo.
            }

            return response;
        } catch (error) {
            if (
                isUsernameUniqueConflict(error)
                && attempt < TENANT_USERNAME_RETRY_LIMIT
            ) {
                continue;
            }

            throw error;
        }
    }

    throw new Error("Tenant username retry exhausted");
};

export const expireReservationsService = async (actor: Actor) => {
    assertCanManageReservations(actor);
    const now = new Date();

    const result = await runSerializableTransaction(async (tx) => {
        const expired = await tx.reservation.findMany({
            where: {
                status: ReservationStatus.ACTIVE,
                expires_at: { lt: now },
                contract_id: null
            },
            select: {
                id: true,
                apartment_id: true,
                expires_at: true,
                tenant: {
                    select: {
                        full_name: true,
                        email: true
                    }
                },
                apartment: {
                    select: {
                        room_number: true,
                        floor: true,
                        building: {
                            select: {
                                address: true
                            }
                        }
                    }
                }
            }
        });
        const expiredNotices: typeof expired = [];
        let expiredCount = 0;

        for (const reservation of expired) {
            const result = await tx.reservation.updateMany({
                where: {
                    id: reservation.id,
                    status: ReservationStatus.ACTIVE,
                    contract_id: null
                },
                data: { status: ReservationStatus.FORFEITED }
            });

            if (result.count === 0) {
                continue;
            }

            expiredCount += result.count;
            await tx.apartment.updateMany({
                where: {
                    id: reservation.apartment_id,
                    status: ApartmentStatus.RESERVED
                },
                data: { status: ApartmentStatus.AVAILABLE }
            });
            expiredNotices.push(reservation);
        }

        return {
            expired_count: expiredCount,
            expiredNotices
        };
    }, reservationConcurrentModification);

    await Promise.all(
        result.expiredNotices.map(sendReservationExpiredNotice)
    );

    return { expired_count: result.expired_count };
};
