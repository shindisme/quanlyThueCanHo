import { InvoiceStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/database.js";

export type NotificationActor = {
    userId: number;
    role: string;
};

export type NotificationFilters = {
    type?: string;
    is_read?: boolean;
    user_id?: number;
    tenant_id?: number;
    building_id?: number;
    search?: string;
    page?: number;
    limit?: number;
};

export type SendBuildingNotificationInput = {
    building_id: number;
    title: string;
    content: string;
    type?: string;
    apartment_ids?: number[];
    tenant_ids?: number[];
};

export type SendInvoiceNotificationInput = {
    building_id?: number;
    invoice_ids?: number[];
    tenant_ids?: number[];
    month?: number;
    year?: number;
    status?: InvoiceStatus;
    title?: string;
    content?: string;
};

export class NotificationError extends Error {
    statusCode: number;

    constructor(message: string, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
    }
}

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

const toNumber = (value: Prisma.Decimal | number) => Number(value);

const normalizeString = (value: unknown, label: string) => {
    if (typeof value !== "string" || !value.trim()) {
        throw new NotificationError(`Vui long nhap ${label}.`);
    }

    return value.trim();
};

const normalizeOptionalString = (value: unknown) => {
    if (typeof value !== "string") {
        return undefined;
    }

    const trimmed = value.trim();
    return trimmed || undefined;
};

const assertCanManageNotifications = (actor: NotificationActor) => {
    if (!["ADMIN", "MANAGER"].includes(actor.role)) {
        throw new NotificationError("Ban khong co quyen gui thong bao.", 403);
    }
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

const requireManagerBuildingId = async (actor: NotificationActor) => {
    if (actor.role === "ADMIN") {
        return undefined;
    }

    const staff = await getActorStaff(actor.userId);
    if (!staff) {
        throw new NotificationError("Tai khoan chua duoc lien ket voi ho so nhan vien.", 403);
    }

    if (!staff.building_id) {
        throw new NotificationError("Nhan vien chua duoc phan cong toa nha.", 403);
    }

    return staff.building_id;
};

const requireTenantId = async (actor: NotificationActor) => {
    const tenant = await getActorTenant(actor.userId);
    if (!tenant) {
        throw new NotificationError("Tai khoan chua duoc lien ket voi ho so nguoi thue.", 403);
    }

    return tenant.id;
};

const assertBuildingAccessible = async (buildingId: number, actor: NotificationActor) => {
    assertCanManageNotifications(actor);

    if (actor.role === "MANAGER") {
        const managerBuildingId = await requireManagerBuildingId(actor);
        if (managerBuildingId !== buildingId) {
            throw new NotificationError("Ban khong co quyen gui thong bao cho toa nha nay.", 403);
        }
    }

    const building = await prisma.building.findUnique({
        where: { id: buildingId },
        select: { id: true }
    });

    if (!building) {
        throw new NotificationError("Toa nha khong ton tai.", 404);
    }
};

const uniqueNumbers = (values?: number[]) => {
    if (!values) {
        return undefined;
    }

    const normalized = values.filter((value) => Number.isInteger(value) && value > 0);
    return [...new Set(normalized)];
};

const assertValidMonthYear = (month: number, year: number) => {
    if (!Number.isInteger(month) || month < 1 || month > 12) {
        throw new NotificationError("Thang hoa don khong hop le.");
    }

    if (!Number.isInteger(year) || year < 2000 || year > 3000) {
        throw new NotificationError("Nam hoa don khong hop le.");
    }
};

const padMonth = (month: number) => month.toString().padStart(2, "0");

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

const getNotificationScopeWhere = async (actor: NotificationActor): Promise<Prisma.NotificationWhereInput> => {
    if (actor.role === "ADMIN") {
        return {};
    }

    if (actor.role === "MANAGER") {
        const buildingId = await requireManagerBuildingId(actor);
        return {
            user: {
                tenant: {
                    contracts: {
                        some: {
                            apartment: {
                                building_id: buildingId
                            }
                        }
                    }
                }
            }
        };
    }

    if (actor.role === "TENANT") {
        return {
            user_id: actor.userId
        };
    }

    throw new NotificationError("Ban khong co quyen truy cap thong bao.", 403);
};

const assertNotificationAccessible = async (notificationId: number, actor: NotificationActor) => {
    const where = await getNotificationScopeWhere(actor);
    const notification = await prisma.notification.findFirst({
        where: {
            id: notificationId,
            AND: [where]
        },
        include: notificationInclude
    });

    if (!notification) {
        throw new NotificationError("Thong bao khong ton tai hoac ban khong co quyen truy cap.", 404);
    }

    return notification;
};

export const getNotificationsService = async (filters: NotificationFilters, actor: NotificationActor) => {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 10));
    const skip = (page - 1) * limit;

    const andFilters: Prisma.NotificationWhereInput[] = [await getNotificationScopeWhere(actor)];

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

    if (filters.user_id) {
        if (actor.role === "TENANT" && actor.userId !== filters.user_id) {
            throw new NotificationError("Ban khong co quyen xem thong bao cua nguoi dung nay.", 403);
        }
        andFilters.push({ user_id: filters.user_id });
    }

    if (filters.tenant_id) {
        if (actor.role === "TENANT") {
            const tenantId = await requireTenantId(actor);
            if (tenantId !== filters.tenant_id) {
                throw new NotificationError("Ban khong co quyen xem thong bao cua nguoi thue nay.", 403);
            }
        }

        andFilters.push({
            user: {
                tenant: {
                    id: filters.tenant_id
                }
            }
        });
    }

    if (filters.building_id) {
        if (actor.role === "MANAGER") {
            const managerBuildingId = await requireManagerBuildingId(actor);
            if (managerBuildingId !== filters.building_id) {
                throw new NotificationError("Ban khong co quyen xem thong bao cua toa nha nay.", 403);
            }
        }

        if (actor.role === "TENANT") {
            throw new NotificationError("Nguoi thue khong the loc thong bao theo toa nha.", 403);
        }

        andFilters.push({
            user: {
                tenant: {
                    contracts: {
                        some: {
                            apartment: {
                                building_id: filters.building_id
                            }
                        }
                    }
                }
            }
        });
    }

    if (filters.search) {
        andFilters.push({
            OR: [
                { title: { contains: filters.search, mode: "insensitive" } },
                { content: { contains: filters.search, mode: "insensitive" } },
                { user: { username: { contains: filters.search, mode: "insensitive" } } },
                { user: { tenant: { full_name: { contains: filters.search, mode: "insensitive" } } } }
            ]
        });
    }

    const whereClause: Prisma.NotificationWhereInput = { AND: andFilters };

    const [notifications, total, unreadCount] = await prisma.$transaction([
        prisma.notification.findMany({
            where: whereClause,
            skip,
            take: limit,
            orderBy: { created_at: "desc" },
            include: notificationInclude
        }),
        prisma.notification.count({ where: whereClause }),
        prisma.notification.count({
            where: {
                AND: [
                    await getNotificationScopeWhere(actor),
                    { is_read: false }
                ]
            }
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
) => {
    await assertBuildingAccessible(input.building_id, actor);

    const title = normalizeString(input.title, "tieu de thong bao");
    const content = normalizeString(input.content, "noi dung thong bao");
    const type = normalizeOptionalString(input.type) ?? "GENERAL";
    const apartmentIds = uniqueNumbers(input.apartment_ids);
    const tenantIds = uniqueNumbers(input.tenant_ids);

    const contracts = await prisma.rentalContract.findMany({
        where: {
            status: "ACTIVE",
            apartment: {
                building_id: input.building_id,
                ...(apartmentIds?.length ? { id: { in: apartmentIds } } : {})
            },
            ...(tenantIds?.length ? { tenant_id: { in: tenantIds } } : {})
        },
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
                    room_number: true,
                    floor: true,
                    building: {
                        select: {
                            id: true,
                            branch_name: true
                        }
                    }
                }
            }
        },
        orderBy: [
            { apartment: { floor: "asc" } },
            { apartment: { room_number: "asc" } }
        ]
    });

    const recipientsByUser = new Map<number, {
        user_id: number;
        tenant_id: number;
        tenant_name: string;
        apartments: Array<{
            id: number;
            room_number: string;
            floor: number;
            building_id: number;
            building_name: string;
        }>;
    }>();

    const skipped = [];

    for (const contract of contracts) {
        if (!contract.tenant.user_id) {
            skipped.push({
                tenant_id: contract.tenant.id,
                tenant_name: contract.tenant.full_name,
                apartment_id: contract.apartment.id,
                room_number: contract.apartment.room_number,
                reason: "Nguoi thue chua co tai khoan nguoi dung."
            });
            continue;
        }

        const existing = recipientsByUser.get(contract.tenant.user_id);
        const apartment = {
            id: contract.apartment.id,
            room_number: contract.apartment.room_number,
            floor: contract.apartment.floor,
            building_id: contract.apartment.building.id,
            building_name: contract.apartment.building.branch_name
        };

        if (existing) {
            existing.apartments.push(apartment);
            continue;
        }

        recipientsByUser.set(contract.tenant.user_id, {
            user_id: contract.tenant.user_id,
            tenant_id: contract.tenant.id,
            tenant_name: contract.tenant.full_name,
            apartments: [apartment]
        });
    }

    const recipients = [...recipientsByUser.values()];

    const created = await prisma.notification.createMany({
        data: recipients.map((recipient) => ({
            user_id: recipient.user_id,
            title,
            content,
            type
        }))
    });

    return {
        building_id: input.building_id,
        total_contracts: contracts.length,
        sent_count: created.count,
        skipped_count: skipped.length,
        recipients,
        skipped
    };
};

const buildInvoiceNotificationContent = (invoice: InvoiceForNotification, customContent?: string) => {
    const roomLabel = `${invoice.contract.apartment.building.branch_name} - phong ${invoice.contract.apartment.room_number}`;
    return [
        customContent?.trim(),
        `Ma hoa don: ${invoice.invoice_code}`,
        `Can ho: ${roomLabel}`,
        `Nguoi thue: ${invoice.contract.tenant.full_name}`,
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

    const invoiceIds = uniqueNumbers(input.invoice_ids);
    const tenantIds = uniqueNumbers(input.tenant_ids);

    if (!input.building_id && !invoiceIds?.length) {
        throw new NotificationError("Vui long chon toa nha hoac danh sach hoa don can gui.");
    }

    if (input.month !== undefined || input.year !== undefined) {
        if (input.month === undefined || input.year === undefined) {
            throw new NotificationError("Can nhap day du month va year de gui hoa don.");
        }

        assertValidMonthYear(input.month, input.year);
    }

    if (input.building_id) {
        await assertBuildingAccessible(input.building_id, actor);
    } else if (actor.role === "MANAGER") {
        const managerBuildingId = await requireManagerBuildingId(actor);
        const invoiceCount = await prisma.invoice.count({
            where: {
                id: { in: invoiceIds },
                contract: {
                    apartment: {
                        building_id: managerBuildingId
                    }
                }
            }
        });

        if (invoiceCount !== invoiceIds?.length) {
            throw new NotificationError("Danh sach hoa don co hoa don nam ngoai toa nha ban quan ly.", 403);
        }
    }

    const andFilters: Prisma.InvoiceWhereInput[] = [];

    if (invoiceIds?.length) {
        andFilters.push({ id: { in: invoiceIds } });
    }

    if (input.building_id) {
        andFilters.push({
            contract: {
                apartment: {
                    building_id: input.building_id
                }
            }
        });
    }

    if (tenantIds?.length) {
        andFilters.push({ tenant_id: { in: tenantIds } });
    }

    if (input.status) {
        andFilters.push({ status: input.status });
    }

    if (input.month !== undefined && input.year !== undefined) {
        andFilters.push({
            invoice_code: {
                contains: `-${input.year}${padMonth(input.month)}`
            }
        });
    }

    const invoices = await prisma.invoice.findMany({
        where: {
            AND: andFilters
        },
        include: invoiceNotificationInclude,
        orderBy: { due_date: "asc" }
    });

    const skipped = [];
    const notificationsData = [];

    for (const invoice of invoices) {
        if (!invoice.contract.tenant.user_id) {
            skipped.push({
                invoice_id: invoice.id,
                invoice_code: invoice.invoice_code,
                tenant_id: invoice.contract.tenant.id,
                tenant_name: invoice.contract.tenant.full_name,
                reason: "Nguoi thue chua co tai khoan nguoi dung."
            });
            continue;
        }

        notificationsData.push({
            user_id: invoice.contract.tenant.user_id,
            title: normalizeOptionalString(input.title) ?? `Hoa don ${invoice.invoice_code}`,
            content: buildInvoiceNotificationContent(invoice, normalizeOptionalString(input.content)),
            type: "INVOICE_NOTICE"
        });
    }

    const created = await prisma.notification.createMany({
        data: notificationsData
    });

    return {
        total_invoices: invoices.length,
        sent_count: created.count,
        skipped_count: skipped.length,
        invoices: invoices.map((invoice) => ({
            id: invoice.id,
            invoice_code: invoice.invoice_code,
            status: invoice.status,
            total_amount: toNumber(invoice.total_amount),
            due_date: invoice.due_date,
            tenant: invoice.contract.tenant,
            apartment: invoice.contract.apartment
        })),
        skipped
    };
};

export const markNotificationReadService = async (
    notificationId: number,
    actor: NotificationActor,
    isRead = true
) => {
    await assertNotificationAccessible(notificationId, actor);

    return prisma.notification.update({
        where: { id: notificationId },
        data: { is_read: isRead },
        include: notificationInclude
    });
};

export const markAllNotificationsReadService = async (actor: NotificationActor) => {
    const scopeWhere = await getNotificationScopeWhere(actor);
    const updated = await prisma.notification.updateMany({
        where: {
            AND: [
                scopeWhere,
                { is_read: false }
            ]
        },
        data: { is_read: true }
    });

    return {
        updated_count: updated.count
    };
};

export const deleteNotificationService = async (notificationId: number, actor: NotificationActor) => {
    await assertNotificationAccessible(notificationId, actor);

    await prisma.notification.delete({
        where: { id: notificationId }
    });
};
