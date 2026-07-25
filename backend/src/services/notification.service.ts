import {
    Prisma,
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
                    email: true
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
                            address_new: true
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
                            address_new: true
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
    const page = filters.page;
    const limit = filters.limit;
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
    const unreadWhere: Prisma.NotificationWhereInput =
        actor.role === Role.ADMIN
            ? { is_read: false }
            : {
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

    return {
        data: notifications,
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

    for (const recipient of recipients) {
        await transaction.notification.create({
            data: {
                title: input.title,
                content: input.content,
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

    return prisma.notification.update({
        where: {
            id: notificationId,
            AND: [scope]
        },
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

    if (actor.role === Role.ADMIN) {
        await prisma.notification.delete({
            where: { id: notificationId }
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

