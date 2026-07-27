import {
    ApartmentStatus,
    InvoiceStatus,
    InvoiceType,
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
import { sendReservationDepositPaymentEmail } from "./mail.service.js";
import { buildDepositPaymentUrl } from "./payment.service.js";
import { runSerializableTransaction } from "../utils/prisma-transaction.js";

type CreateReservationInput = CreateReservationRequest["body"];
type ListReservationsInput = ListReservationsRequest["query"];

const RESERVATION_DAYS = 15;
const TENANT_USERNAME_RETRY_LIMIT = 3;

const addDays = (date: Date, days: number) => {
    const next = new Date(date);
    next.setUTCDate(next.getUTCDate() + days);
    return next;
};

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

const reservationInclude = {
    tenant: {
        select: {
            id: true,
            user_id: true,
            full_name: true,
            phone: true,
            email: true,
            citizen_id: true,
            is_verified: true
        }
    },
    apartment: {
        select: {
            id: true,
            building_id: true,
            floor: true,
            room_number: true,
            status: true
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

const invoiceInclude = {
    items: true
} satisfies Prisma.InvoiceInclude;

const formatApartmentLabel = (
    apartment: {
        room_number: string;
        floor: number;
    }
) => `P.${apartment.room_number} - Táº§ng ${apartment.floor}`;

const sendDepositPaymentEmail = async (
    data: {
        tenant: {
            email: string | null;
            full_name: string;
        };
        invoice: {
            id: number;
            invoice_code: string;
            total_amount: Prisma.Decimal | number;
        };
        reservation: {
            expires_at: Date;
        };
        apartment: {
            room_number: string;
            floor: number;
            building: {
                address: string;
            };
        };
    }
) => {
    if (data.tenant.email === null) {
        return;
    }

    try {
        await sendReservationDepositPaymentEmail({
            to: data.tenant.email,
            tenantName: data.tenant.full_name,
            invoiceCode: data.invoice.invoice_code,
            depositAmount: Number(data.invoice.total_amount),
            apartmentLabel: formatApartmentLabel(data.apartment),
            buildingAddress: data.apartment.building.address,
            paymentUrl: buildDepositPaymentUrl(data.invoice.id),
            moveInDeadline: data.reservation.expires_at
        });
    } catch {
        // Email lỗi không được làm rollback đặt cọc đã tạo.
    }
};
export const getReservationsService = async (
    input: ListReservationsInput,
    actor: Actor
) => {
    assertCanManageReservations(actor);

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

    const usernameBase = tenantUsername(input.tenant.citizen_id);
    const credential = await createInitialCredential();

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
                const existingTenant = await tx.tenant.findFirst({
                    where: {
                        citizen_id: input.tenant.citizen_id
                    },
                    select: {
                        id: true
                    }
                });

                if (existingTenant) {
                    throw new AppError(
                        409,
                        "TENANT_EXISTS",
                        "Người thuê đã tồn tại"
                    );
                }

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
                const user = await tx.user.create({
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
                const tenant = await tx.tenant.create({
                    data: {
                        ...input.tenant,
                        is_verified: false,
                        user: {
                            connect: { id: user.id }
                        }
                    },
                    select: {
                        id: true,
                        user_id: true,
                        full_name: true,
                        phone: true,
                        email: true,
                        date_of_birth: true,
                        citizen_id: true,
                        address: true,
                        is_verified: true,
                        created_at: true
                    }
                });
                const now = new Date();
                const reservation = await tx.reservation.create({
                    data: {
                        apartment_id: apartment.id,
                        tenant_id: tenant.id,
                        deposit_amount: input.deposit_amount,
                        status: ReservationStatus.ACTIVE,
                        expires_at: addDays(now, RESERVATION_DAYS)
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
                        status: InvoiceStatus.UNPAID,
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

                return {
                    reservation,
                    invoice,
                    tenant,
                    user,
                    initial_password: credential.initial_password,
                    apartment
                };
            }, reservationConcurrentModification);

            await sendDepositPaymentEmail(result);
            const { apartment: _apartment, ...response } = result;

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

    return runSerializableTransaction(async (tx) => {
        const expired = await tx.reservation.findMany({
            where: {
                status: ReservationStatus.ACTIVE,
                expires_at: { lt: now },
                contract_id: null
            },
            select: {
                id: true,
                apartment_id: true
            }
        });
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
        }

        return { expired_count: expiredCount };
    }, reservationConcurrentModification);
};