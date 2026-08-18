import {
    ContractStatus,
    Prisma,
    ReservationStatus,
    Role
} from "@prisma/client";
import { prisma } from "../config/database.js";
import { AppError } from "../errors/app-error.js";
import type {
    ListNotificationsRequest,
    SendBuildingNotificationRequest,
    SendInvoiceNotificationsRequest
} from "../schemas/notification.schema.js";
import type { Actor } from "../types/auth.js";
import { getCurrentManagerAssignment } from "../utils/manager-scope.js";

export type NotificationActor = Actor;
export type NotificationFilters =
    ListNotificationsRequest["query"];
export type SendBuildingNotificationInput =
    SendBuildingNotificationRequest["body"];
export type SendInvoiceNotificationInput =
    SendInvoiceNotificationsRequest["body"];

const notificationInclude = {
    user: {
        select: {
            id: true,
            username: true,
            role: true,
            tenant: {
                select: {
                    id: true,
                    full_name: true,
                    phone: true,
                    email: true,
                    contracts: {
                        where: {
                            status: ContractStatus.ACTIVE
                        },
                        select: {
                            id: true,
                            apartment: {
                                select: {
                                    id: true,
                                    room_number: true,
                                    floor: true,
                                    building: {
                                        select: {
                                            id: true,
                                            branch_name: true,
                                            address: true
                                        }
                                    }
                                }
                            }
                        },
                        take: 1
                    },
                    reservations: {
                        where: {
                            status: ReservationStatus.ACTIVE
                        },
                        select: {
                            id: true,
                            apartment: {
                                select: {
                                    id: true,
                                    room_number: true,
                                    floor: true,
                                    building: {
                                        select: {
                                            id: true,
                                            branch_name: true,
                                            address: true
                                        }
                                    }
                                }
                            }
                        },
                        take: 1
                    }
                }
            },
            staff: {
                select: {
                    id: true,
                    full_name: true,
                    building: {
                        select: {
                            id: true,
                            branch_name: true,
                            address: true
                        }
                    }
                }
            }
        }
    }
} satisfies Prisma.NotificationInclude;

const invoiceNotificationInclude = {
    tenant: {
        select: {
            id: true,
            full_name: true,
            phone: true,
            email: true,
            user_id: true
        }
    },
    reservation: {
        include: {
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
                            address: true
                        }
                    }
                }
            }
        }
    },
    contract: {
        include: {
            tenant: {
                select: {
                    id: true,
                    full_name: true,
                    phone: true,
                    email: true,
                    user_id: true
                }
            },
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
                            address: true
                        }
                    }
                }
            }
        }
    }
} satisfies Prisma.InvoiceInclude;

type InvoiceForNotification = Prisma.InvoiceGetPayload<{
    include: typeof invoiceNotificationInclude;
}>;

type ManagerAssignment =
    ReturnType<typeof getCurrentManagerAssignment>;

const notFound = () => new AppError(
    404,
    "NOT_FOUND",
    "Thông báo không tồn tại"
);

const forbidden = (message: string) => new AppError(
    403,
    "FORBIDDEN",
    message
);

const concurrentModification = () => new AppError(
    409,
    "CONCURRENT_MODIFICATION",
    "Phạm vi thông báo đã bị thay đổi trong quá trình thực hiện"
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

const getApartmentBuildingScope = (
    buildingId: number,
    assignment?: ManagerAssignment
) => ({
    building_id: buildingId,
    ...(assignment
        ? { building: assignment.assignmentWhere }
        : {})
}) satisfies Prisma.ApartmentWhereInput;

const getBuildingUserScope = (
    buildingId: number,
    assignment?: ManagerAssignment
) => {
    const buildingRelation = assignment
        ? assignment.assignmentWhere
        : undefined;
    const apartmentScope = getApartmentBuildingScope(
        buildingId,
        assignment
    );

    return {
        role: {
            not: Role.ADMIN
        },
        OR: [
            {
                staff: {
                    building_id: buildingId,
                    ...(buildingRelation
                        ? { building: buildingRelation }
                        : {})
                }
            },
            {
                tenant: {
                    OR: [
                        {
                            onboarding_building_id: buildingId,
                            ...(buildingRelation
                                ? {
                                    onboarding_building:
                                        buildingRelation
                                }
                                : {})
                        },
                        {
                            contracts: {
                                some: {
                                    apartment: apartmentScope
                                }
                            }
                        }
                    ]
                }
            }
        ]
    } satisfies Prisma.UserWhereInput;
};

const getNotificationScope = (
    actor: NotificationActor
): Prisma.NotificationWhereInput => {
    if (actor.role === Role.ADMIN) {
        return {};
    }

    if (actor.role === Role.MANAGER) {
        const assignment = getCurrentManagerAssignment(actor);
        return {
            user: getBuildingUserScope(
                assignment.buildingId,
                assignment
            )
        };
    }

    if (actor.role === Role.TENANT || actor.role === Role.STAFF) {
        return {
            user_id: actor.userId
        };
    }

    throw forbidden("Bạn không có quyền truy cập vào thông báo");
};

const assertCanManageNotifications = (actor: NotificationActor) => {
    if (
        actor.role !== Role.ADMIN
        && actor.role !== Role.MANAGER
    ) {
        throw forbidden("Bạn không có quyền gửi thông báo");
    }
};

const toNumber = (value: Prisma.Decimal | number) => Number(value);
const padMonth = (month: number) =>
    month.toString().padStart(2, "0");

const formatMoney = (value: Prisma.Decimal | number) =>
    new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0
    }).format(toNumber(value));

const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "short",
        timeZone: "Asia/Ho_Chi_Minh"
    }).format(date);

const resolveManagedBuilding = async (
    requestedBuildingId: number,
    actor: NotificationActor,
    transaction: Prisma.TransactionClient
) => {
    assertCanManageNotifications(actor);

    if (actor.role === Role.MANAGER) {
        const assignment = getCurrentManagerAssignment(actor);
        const building = await transaction.building.findFirst({
            where: assignment.buildingWhere,
            select: { id: true }
        });

        if (!building) {
            throw notFound();
        }

        return {
            buildingId: assignment.buildingId,
            assignment
        };
    }

    const building = await transaction.building.findUnique({
        where: { id: requestedBuildingId },
        select: { id: true }
    });

    if (!building) {
        throw notFound();
    }

    return {
        buildingId: requestedBuildingId,
        assignment: undefined
    };
};

export const getNotificationsService = async (
    filters: NotificationFilters,
    actor: NotificationActor
) => {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const scope = getNotificationScope(actor);
    const andFilters: Prisma.NotificationWhereInput[] =
        actor.role === Role.ADMIN ? [] : [scope];

    if (filters.type) {
        andFilters.push({
            type: {
                equals: filters.type,
                mode: "insensitive"
            }
        });
    }
    if (filters.is_read !== undefined) {
        andFilters.push({ is_read: filters.is_read });
    }

    if (
        actor.role !== Role.TENANT
        && filters.user_id !== undefined
    ) {
        andFilters.push({ user_id: filters.user_id });
    }
    if (
        actor.role !== Role.TENANT
        && filters.tenant_id !== undefined
    ) {
        andFilters.push({
            user: {
                tenant: {
                    id: filters.tenant_id
                }
            }
        });
    }
    if (
        actor.role === Role.ADMIN
        && filters.building_id !== undefined
    ) {
        andFilters.push({
            user: getBuildingUserScope(filters.building_id)
        });
    }

    if (filters.search) {
        andFilters.push({
            OR: [
                {
                    title: {
                        contains: filters.search,
                        mode: "insensitive"
                    }
                },
                {
                    content: {
                        contains: filters.search,
                        mode: "insensitive"
                    }
                },
                {
                    user: {
                        username: {
                            contains: filters.search,
                            mode: "insensitive"
                        }
                    }
                },
                {
                    user: {
                        tenant: {
                            full_name: {
                                contains: filters.search,
                                mode: "insensitive"
                            }
                        }
                    }
                }
            ]
        });
    }

    const where: Prisma.NotificationWhereInput =
        andFilters.length === 0
            ? {}
            : { AND: andFilters };

    if (actor.role === Role.ADMIN || actor.role === Role.MANAGER) {
        const rawNotifications = await prisma.notification.findMany({
            where,
            orderBy: { created_at: "desc" },
            include: notificationInclude
        });

        const groups = new Map<string, typeof rawNotifications>();
        for (const notif of rawNotifications) {
            const timeKey = Math.floor(new Date(notif.created_at).getTime() / (60 * 1000));
            const key = `${notif.title}:::${notif.content}:::${notif.type}:::${timeKey}`;
            const existing = groups.get(key);
            if (existing) {
                existing.push(notif);
            } else {
                groups.set(key, [notif]);
            }
        }

        const formattedList = Array.from(groups.values()).map((group) => {
            const primary = group[0];
            const isAllRead = group.every((n) => n.is_read);
            const recipients = group.map((n) => {
                const apt = n.user.tenant?.contracts[0]?.apartment
                    || n.user.tenant?.reservations[0]?.apartment
                    || null;
                return {
                    id: n.user.id,
                    username: n.user.username,
                    full_name: n.user.tenant?.full_name || n.user.staff?.full_name || n.user.username,
                    role: n.user.role,
                    apartment: apt
                };
            });

            const aptMap = new Map<number, NonNullable<(typeof recipients)[0]["apartment"]>>();
            for (const r of recipients) {
                if (r.apartment) {
                    aptMap.set(r.apartment.id, r.apartment);
                }
            }
            const uniqueApts = Array.from(aptMap.values());
            const primaryBuilding = uniqueApts[0]?.building
                || group[0].user.staff?.building
                || null;

            return {
                id: primary.id,
                user_id: primary.user_id,
                title: primary.title,
                content: primary.content,
                type: primary.type,
                is_read: isAllRead,
                created_at: primary.created_at,
                recipient_count: group.length,
                recipients,
                apartment: uniqueApts.length === 1 ? uniqueApts[0] : null,
                apartments: uniqueApts.length > 1 ? uniqueApts : undefined,
                building: primaryBuilding ? { id: primaryBuilding.id, branch_name: primaryBuilding.branch_name } : null,
                tenant: group.length === 1 && group[0].user.tenant ? {
                    id: group[0].user.tenant.id,
                    full_name: group[0].user.tenant.full_name,
                    phone: group[0].user.tenant.phone,
                    email: group[0].user.tenant.email
                } : null
            };
        });

        const unreadCount = formattedList.filter((n) => !n.is_read).length;
        const total = formattedList.length;
        const skip = (page - 1) * limit;
        const paginated = formattedList.slice(skip, skip + limit);

        return {
            data: paginated,
            unread_count: unreadCount,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    const unreadWhere: Prisma.NotificationWhereInput = {
        AND: [
            scope,
            { is_read: false }
        ]
    };
    const skip = (page - 1) * limit;
    const [notifications, total, unreadCount] =
        await prisma.$transaction([
            prisma.notification.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: "desc" },
                include: notificationInclude
            }),
            prisma.notification.count({ where }),
            prisma.notification.count({
                where: unreadWhere
            })
        ]);

    const formattedData = notifications.map((notif) => {
        const apt = notif.user.tenant?.contracts[0]?.apartment
            || notif.user.tenant?.reservations[0]?.apartment
            || null;
        return {
            id: notif.id,
            user_id: notif.user_id,
            title: notif.title,
            content: notif.content,
            type: notif.type,
            is_read: notif.is_read,
            created_at: notif.created_at,
            apartment: apt,
            building: apt?.building ? { id: apt.building.id, branch_name: apt.building.branch_name } : null
        };
    });

    return {
        data: formattedData,
        unread_count: unreadCount,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
};

export const sendBuildingNotificationService = async (
    input: SendBuildingNotificationInput,
    actor: NotificationActor
) => runSerializableTransaction(async (transaction) => {
    const {
        buildingId,
        assignment
    } = await resolveManagedBuilding(
        input.building_id,
        actor,
        transaction
    );
    const targetFilters: Prisma.UserWhereInput[] = [
        getBuildingUserScope(buildingId, assignment)
    ];

    if (input.tenant_ids || input.apartment_ids) {
        targetFilters.push({
            tenant: {
                ...(input.tenant_ids
                    ? { id: { in: input.tenant_ids } }
                    : {}),
                ...(input.apartment_ids
                    ? {
                        contracts: {
                            some: {
                                apartment: {
                                    id: {
                                        in: input.apartment_ids
                                    },
                                    ...getApartmentBuildingScope(
                                        buildingId,
                                        assignment
                                    )
                                }
                            }
                        }
                    }
                    : {})
            }
        });
    }

    const recipients = await transaction.user.findMany({
        where: {
            AND: targetFilters
        },
        select: {
            id: true,
            username: true,
            role: true,
            tenant: {
                select: {
                    id: true,
                    full_name: true
                }
            },
            staff: {
                select: {
                    id: true,
                    full_name: true
                }
            }
        },
        orderBy: { id: "asc" }
    });

    let finalContent = input.content;
    if (input.apartment_ids && input.apartment_ids.length > 0) {
        const targetApartments = await transaction.apartment.findMany({
            where: { id: { in: input.apartment_ids } },
            select: { room_number: true, floor: true }
        });
        if (targetApartments.length > 0) {
            const aptListStr = targetApartments.map((a) => `P.${a.room_number}`).join(", ");
            if (!finalContent.startsWith("[Căn hộ:")) {
                finalContent = `[Căn hộ: ${aptListStr}]\n${finalContent}`;
            }
        }
    }

    for (const recipient of recipients) {
        await transaction.notification.create({
            data: {
                title: input.title,
                content: finalContent,
                type: input.type,
                user: {
                    connect: {
                        id: recipient.id,
                        AND: targetFilters
                    }
                }
            }
        });
    }

    return {
        building_id: buildingId,
        sent_count: recipients.length,
        recipients
    };
});

const buildInvoiceNotificationContent = (
    invoice: InvoiceForNotification,
    customContent?: string
) => {
    const apartment = invoice.contract?.apartment
        ?? invoice.reservation?.apartment
        ?? null;
    const roomLabel = apartment
        ? `${apartment.building.branch_name} - phong ${apartment.room_number}`
        : "Chua co can ho";

    return [
        customContent,
        `Ma hoa don: ${invoice.invoice_code}`,
        `Can ho: ${roomLabel}`,
        `Nguoi thue: ${invoice.tenant.full_name}`,
        `Tong tien: ${formatMoney(invoice.total_amount)}`,
        `Han thanh toan: ${formatDate(invoice.due_date)}`,
        `Trang thai: ${invoice.status}`
    ].filter(Boolean).join("\n");
};

export const sendInvoiceNotificationsService = async (
    input: SendInvoiceNotificationInput,
    actor: NotificationActor
) => {
    assertCanManageNotifications(actor);
    const andFilters: Prisma.InvoiceWhereInput[] = [];

    if (actor.role === Role.MANAGER) {
        const assignment = getCurrentManagerAssignment(actor);
        const apartmentScope = getApartmentBuildingScope(
            assignment.buildingId,
            assignment
        );
        andFilters.push({
            OR: [
                { contract: { apartment: apartmentScope } },
                { reservation: { apartment: apartmentScope } }
            ]
        });
    } else if (input.building_id !== undefined) {
        andFilters.push({
            OR: [
                {
                    contract: {
                        apartment: {
                            building_id: input.building_id
                        }
                    }
                },
                {
                    reservation: {
                        apartment: {
                            building_id: input.building_id
                        }
                    }
                }
            ]
        });
    }

    if (input.invoice_ids) {
        andFilters.push({
            id: { in: input.invoice_ids }
        });
    }
    if (input.tenant_ids) {
        andFilters.push({
            tenant_id: { in: input.tenant_ids }
        });
    }
    if (input.status) {
        andFilters.push({ status: input.status });
    }
    if (
        input.month !== undefined
        && input.year !== undefined
    ) {
        andFilters.push({
            invoice_code: {
                contains: `-${input.year}${padMonth(input.month)}`
            }
        });
    }

    return runSerializableTransaction(async (transaction) => {
        const invoices = await transaction.invoice.findMany({
            where: {
                AND: andFilters
            },
            include: invoiceNotificationInclude,
            orderBy: { due_date: "asc" }
        });

        if (
            input.invoice_ids
            && invoices.length !== new Set(input.invoice_ids).size
        ) {
            throw notFound();
        }

        const skipped: Array<{
            invoice_id: number;
            reason: string;
        }> = [];
        let sentCount = 0;

        for (const invoice of invoices) {
            const userId = invoice.tenant.user_id;
            if (!userId) {
                skipped.push({
                    invoice_id: invoice.id,
                    reason: "Tenant has no user account"
                });
                continue;
            }

            await transaction.notification.create({
                data: {
                    title: input.title
                        ?? `Hoa don ${invoice.invoice_code}`,
                    content: buildInvoiceNotificationContent(
                        invoice,
                        input.content
                    ),
                    type: "INVOICE_NOTICE",
                    user: {
                        connect: {
                            id: userId,
                            tenant: {
                                id: invoice.tenant_id,
                                invoices: {
                                    some: {
                                        id: invoice.id,
                                        AND: andFilters
                                    }
                                }
                            }
                        }
                    }
                }
            });
            sentCount++;
        }

        return {
            total_invoices: invoices.length,
            sent_count: sentCount,
            skipped_count: skipped.length,
            invoices: invoices.map((invoice) => ({
                id: invoice.id,
                invoice_code: invoice.invoice_code,
                status: invoice.status,
                total_amount: toNumber(invoice.total_amount),
                due_date: invoice.due_date,
                tenant: invoice.tenant,
                apartment: invoice.contract?.apartment ?? invoice.reservation?.apartment ?? null
            })),
            skipped
        };
    });
};

export const markNotificationReadService = async (
    notificationId: number,
    actor: NotificationActor,
    isRead = true
) => {
    const scope = getNotificationScope(actor);
    const target = await prisma.notification.findFirst({
        where: {
            id: notificationId,
            ...(actor.role === Role.ADMIN ? {} : { AND: [scope] })
        }
    });

    if (!target) {
        throw notFound();
    }

    if (actor.role === Role.ADMIN || actor.role === Role.MANAGER) {
        const timeStart = new Date(new Date(target.created_at).getTime() - 120000);
        const timeEnd = new Date(new Date(target.created_at).getTime() + 120000);
        await prisma.notification.updateMany({
            where: {
                title: target.title,
                content: target.content,
                type: target.type,
                created_at: {
                    gte: timeStart,
                    lte: timeEnd
                }
            },
            data: { is_read: isRead }
        });
        return { ...target, is_read: isRead };
    }

    return prisma.notification.update({
        where: { id: notificationId },
        data: { is_read: isRead },
        include: notificationInclude
    });
};

export const markAllNotificationsReadService = async (
    actor: NotificationActor
) => {
    const scope = getNotificationScope(actor);
    const result = await prisma.notification.updateMany({
        where: actor.role === Role.ADMIN
            ? { is_read: false }
            : {
                ...scope,
                is_read: false
            },
        data: { is_read: true }
    });

    return {
        updated_count: result.count
    };
};

export const deleteNotificationService = async (
    notificationId: number,
    actor: NotificationActor
) => {
    const scope = getNotificationScope(actor);
    const target = await prisma.notification.findFirst({
        where: {
            id: notificationId,
            ...(actor.role === Role.ADMIN ? {} : { AND: [scope] })
        }
    });

    if (!target) {
        throw notFound();
    }

    if (actor.role === Role.ADMIN || actor.role === Role.MANAGER) {
        const timeStart = new Date(new Date(target.created_at).getTime() - 120000);
        const timeEnd = new Date(new Date(target.created_at).getTime() + 120000);
        await prisma.notification.deleteMany({
            where: {
                title: target.title,
                content: target.content,
                type: target.type,
                created_at: {
                    gte: timeStart,
                    lte: timeEnd
                }
            }
        });
        return;
    }

    const result = await prisma.notification.deleteMany({
        where: {
            id: notificationId,
            ...scope
        }
    });

    if (result.count === 0) {
        throw notFound();
    }
};

