import {
    ContractStatus,
    InvoiceStatus,
    Prisma,
    RequestStatus,
    Role,
    UserStatus
} from "@prisma/client";
import { prisma } from "../config/database.js";
import { AppError } from "../errors/app-error.js";
import type {
    CompleteMaintenanceRequest,
    ConfirmMaintenanceRequest,
    CreateMaintenanceRequest,
    ListMaintenanceRequest,
    UnableMaintenanceRequest
} from "../schemas/maintenance.schema.js";
import type { Actor } from "../types/auth.js";
import {
    getCurrentManagerAssignment,
    getCurrentStaffAssignment
} from "../utils/manager-scope.js";
import { isPositiveDecimal12_2Amount } from "../utils/money.js";

const maintenanceInclude = {
    tenant: {
        select: {
            id: true,
            user_id: true,
            full_name: true
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
    },
    assigned_staff: {
        select: {
            id: true,
            full_name: true,
            phone: true,
            position: true,
            building_id: true
        }
    }
} satisfies Prisma.MaintenanceRequestInclude;

const notFound = () => new AppError(
    404,
    "NOT_FOUND",
    "Yêu cầu bảo trì không tồn tại"
);

const forbidden = (message = "Bạn không có quyền truy cập các yêu cầu bảo trì") => new AppError(
    403,
    "FORBIDDEN",
    message
);

const conflict = (message: string) => new AppError(
    409,
    "INVALID_STATUS_TRANSITION",
    message
);

const isRecordNotFound = (error: unknown) =>
    error instanceof Prisma.PrismaClientKnownRequestError
    && error.code === "P2025";

const invalidTechnician = () => new AppError(
    400,
    "INVALID_TECHNICIAN",
    "Nhân viên được phân công phải là kỹ thuật viên đang hoạt động trong cùng tòa nhà"
);

const invalidRepairFee = () => new AppError(
    400,
    "INVALID_REPAIR_FEE",
    "Phí sửa chữa phải lớn hơn 0 và không vượt quá giới hạn cho phép"
);

const formatSchedule = (value: Date) =>
    new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "Asia/Ho_Chi_Minh"
    }).format(value);

const getScope = (
    actor: Actor
): Prisma.MaintenanceRequestWhereInput => {
    if (actor.role === Role.ADMIN) {
        return {};
    }

    if (actor.role === Role.MANAGER) {
        const assignment = getCurrentManagerAssignment(actor);
        return {
            apartment: {
                building_id: assignment.buildingId,
                building: assignment.assignmentWhere
            }
        };
    }

    if (actor.role === Role.STAFF) {
        const assignment = getCurrentStaffAssignment(actor);
        return {
            assigned_staff_id: actor.staffId!,
            apartment: {
                building_id: assignment.buildingId,
                building: assignment.assignmentWhere
            }
        };
    }

    if (actor.role === Role.TENANT && actor.tenantId !== undefined) {
        return { tenant_id: actor.tenantId };
    }

    throw forbidden();
};

export const getMaintenanceRequestsService = async (
    filters: ListMaintenanceRequest["query"],
    actor: Actor
) => {
    const conditions: Prisma.MaintenanceRequestWhereInput[] =
        actor.role === Role.ADMIN ? [] : [getScope(actor)];

    if (filters.status !== undefined) {
        conditions.push({ status: filters.status });
    }
    if (filters.priority !== undefined) {
        conditions.push({ priority: filters.priority });
    }
    if (
        actor.role === Role.ADMIN
        && filters.building_id !== undefined
    ) {
        conditions.push({
            apartment: { building_id: filters.building_id }
        });
    }

    const where: Prisma.MaintenanceRequestWhereInput =
        conditions.length === 0
            ? {}
            : { AND: conditions };
    const skip = (filters.page - 1) * filters.limit;
    const [data, total] = await Promise.all([
        prisma.maintenanceRequest.findMany({
            where,
            skip,
            take: filters.limit,
            orderBy: { created_at: "desc" },
            include: maintenanceInclude
        }),
        prisma.maintenanceRequest.count({ where })
    ]);

    return {
        data,
        pagination: {
            total,
            page: filters.page,
            limit: filters.limit,
            totalPages: Math.ceil(total / filters.limit)
        }
    };
};

export const getMaintenanceRequestByIdService = async (
    id: number,
    actor: Actor
) => {
    const maintenanceRequest =
        await prisma.maintenanceRequest.findFirst({
            where: {
                id,
                ...getScope(actor)
            },
            include: maintenanceInclude
        });

    if (!maintenanceRequest) {
        throw notFound();
    }

    return maintenanceRequest;
};

export const createMaintenanceRequestService = async (
    input: CreateMaintenanceRequest["body"],
    actor: Actor
) => {
    if (actor.tenantId === undefined) {
        throw forbidden();
    }
    if (input.title.trim().startsWith("[Yêu cầu trả phòng]")) {
        throw new AppError(
            400,
            "MAINTENANCE_NOT_FOR_TERMINATION",
            "Yêu cầu trả phòng phải tạo trong quy trình thanh lý hợp đồng, không phải bảo trì."
        );
    }

    // Kiểm tra hợp đồng có hoạt động ko
    const hasActiveContract = await prisma.rentalContract.count({
        where: {
            apartment_id: input.apartment_id,
            tenant_id: actor.tenantId,
            status: ContractStatus.ACTIVE
        }
    }) > 0;

    if (!hasActiveContract) {
        throw forbidden("Hợp đồng tại căn hộ này đã hết hạn hoặc không tồn tại");
    }

    try {
        return await prisma.maintenanceRequest.create({
            data: {
                title: input.title,
                description: input.description,
                priority: input.priority,
                image_url: input.image_url,
                tenant: {
                    connect: {
                        id: actor.tenantId
                    }
                },
                apartment: {
                    connect: {
                        id: input.apartment_id
                    }
                }
            },
            include: maintenanceInclude
        });
    } catch (error) {
        if (isRecordNotFound(error)) {
            throw notFound();
        }
        throw error;
    }
};

export const cancelMaintenanceRequestService = async (
    id: number,
    actor: Actor
) => {
    if (actor.tenantId === undefined) {
        throw forbidden();
    }

    const current = await prisma.maintenanceRequest.findFirst({
        where: {
            id,
            tenant_id: actor.tenantId
        },
        include: maintenanceInclude
    });

    if (!current) {
        throw notFound();
    }
    if (current.status !== RequestStatus.PENDING) {
        throw conflict(
            "Chỉ yêu cầu bảo trì đang chờ xử lý mới có thể hủy"
        );
    }

    try {
        return await prisma.maintenanceRequest.update({
            where: {
                id,
                tenant_id: actor.tenantId,
                status: RequestStatus.PENDING
            },
            data: { status: RequestStatus.CANCELLED },
            include: maintenanceInclude
        });
    } catch (error) {
        if (isRecordNotFound(error)) {
            throw conflict("Trạng thái yêu cầu bảo trì đã thay đổi");
        }
        throw error;
    }
};

export const confirmMaintenanceRequestService = async (
    id: number,
    input: ConfirmMaintenanceRequest["body"],
    actor: Actor
) => prisma.$transaction(async (transaction) => {
    if (
        actor.role !== Role.ADMIN
        && actor.role !== Role.MANAGER
    ) {
        throw forbidden();
    }
    if (input.scheduled_at <= new Date()) {
        throw new AppError(
            400,
            "INVALID_SCHEDULE",
            "Thời gian lên lịch phải ở tương lai"
        );
    }

    const scope = getScope(actor);
    const current = await transaction.maintenanceRequest.findFirst({
        where: {
            id,
            ...scope
        },
        include: maintenanceInclude
    });

    if (!current) {
        throw notFound();
    }
    if (
        current.status !== RequestStatus.PENDING
        && current.status !== RequestStatus.NEEDS_RESCHEDULE
    ) {
        throw conflict(
            "Chỉ yêu cầu bảo trì đang chờ hoặc cần đổi lịch mới có thể xác nhận"
        );
    }

    const technician = await transaction.staff.findFirst({
        where: {
            id: input.assigned_staff_id,
            building_id: current.apartment.building_id,
            position: "Kỹ thuật",
            user: {
                role: Role.STAFF,
                status: UserStatus.ACTIVE
            }
        },
        include: { user: true }
    });

    if (!technician) {
        throw invalidTechnician();
    }

    let updated;
    try {
        updated = await transaction.maintenanceRequest.update({
            where: {
                ...scope,
                id,
                status: current.status
            },
            data: {
                status: RequestStatus.PROCESSING,
                scheduled_at: input.scheduled_at,
                unable_reason: null,
                assigned_staff: {
                    connect: {
                        id: technician.id,
                        building_id: current.apartment.building_id,
                        position: "Kỹ thuật",
                        user: {
                            role: Role.STAFF,
                            status: UserStatus.ACTIVE
                        }
                    }
                }
            },
            include: maintenanceInclude
        });
    } catch (error) {
        if (isRecordNotFound(error)) {
            throw conflict("Trạng thái yêu cầu bảo trì đã thay đổi");
        }
        throw error;
    }

    if (current.tenant.user_id !== null) {
        await transaction.notification.create({
            data: {
                user_id: current.tenant.user_id,
                title: "Lịch sửa chữa đã được xác nhận",
                content:
                    `${current.title} - phòng `
                    + `${current.apartment.room_number}, `
                    + `${formatSchedule(input.scheduled_at)}, `
                    + `kỹ thuật: ${technician.full_name}`,
                type: "MAINTENANCE"
            }
        });
    }

    return updated;
});

const getAssignedTechnicianScope = (actor: Actor) => ({
    id: actor.staffId!,
    user_id: actor.userId,
    position: "Kỹ thuật",
    user: {
        role: Role.STAFF,
        status: UserStatus.ACTIVE
    }
});

const getAssignedProcessingRequest = async (
    transaction: Prisma.TransactionClient,
    id: number,
    actor: Actor
) => {
    const assignment = getCurrentStaffAssignment(actor);
    const current = await transaction.maintenanceRequest.findFirst({
        where: {
            id,
            assigned_staff_id: actor.staffId!,
            assigned_staff: getAssignedTechnicianScope(actor),
            apartment: {
                building_id: assignment.buildingId,
                building: assignment.assignmentWhere
            }
        },
        include: maintenanceInclude
    });

    if (!current) {
        throw notFound();
    }
    if (current.status !== RequestStatus.PROCESSING) {
        throw conflict(
            "Chỉ yêu cầu bảo trì đang xử lý mới có thể cập nhật"
        );
    }

    return {
        current,
        assignment
    };
};

const createMaintenanceNotifications = async (
    transaction: Prisma.TransactionClient,
    userIds: number[],
    title: string,
    content: string
) => {
    const ids = [...new Set(userIds)];
    if (ids.length === 0) return;

    await transaction.notification.createMany({
        data: ids.map((userId) => ({
            user_id: userId,
            title,
            content,
            type: "MAINTENANCE"
        }))
    });
};

export const markMaintenanceUnableService = async (
    id: number,
    input: UnableMaintenanceRequest["body"],
    actor: Actor
) => prisma.$transaction(async (transaction) => {
    const {
        current,
        assignment
    } = await getAssignedProcessingRequest(
        transaction,
        id,
        actor
    );
    let updated;
    try {
        updated = await transaction.maintenanceRequest.update({
            where: {
                id,
                assigned_staff_id: actor.staffId!,
                assigned_staff: getAssignedTechnicianScope(actor),
                status: RequestStatus.PROCESSING,
                apartment: {
                    building_id: assignment.buildingId,
                    building: assignment.assignmentWhere
                }
            },
            data: {
                status: RequestStatus.NEEDS_RESCHEDULE,
                unable_reason: input.reason
            },
            include: maintenanceInclude
        });
    } catch (error) {
        if (isRecordNotFound(error)) {
            throw conflict("Trạng thái yêu cầu bảo trì đã thay đổi");
        }
        throw error;
    }

    const managers = await transaction.user.findMany({
        where: {
            role: Role.MANAGER,
            status: UserStatus.ACTIVE,
            staff: {
                building_id: current.apartment.building_id
            }
        },
        select: { id: true }
    });
    const recipientIds = managers.map(({ id: userId }) => userId);

    if (current.tenant.user_id !== null) {
        recipientIds.push(current.tenant.user_id);
    }

    await createMaintenanceNotifications(
        transaction,
        recipientIds,
        "Chưa thể thực hiện sửa chữa",
        `${current.title}: ${input.reason}`
    );

    return updated;
});

export const completeMaintenanceRequestService = async (
    id: number,
    input: CompleteMaintenanceRequest["body"],
    actor: Actor
) => prisma.$transaction(async (transaction) => {
    const {
        current,
        assignment
    } = await getAssignedProcessingRequest(
        transaction,
        id,
        actor
    );
    let updated;
    try {
        updated = await transaction.maintenanceRequest.update({
            where: {
                id,
                assigned_staff_id: actor.staffId!,
                assigned_staff: getAssignedTechnicianScope(actor),
                status: RequestStatus.PROCESSING,
                apartment: {
                    building_id: assignment.buildingId,
                    building: assignment.assignmentWhere
                }
            },
            data: { status: RequestStatus.DONE },
            include: maintenanceInclude
        });
    } catch (error) {
        if (isRecordNotFound(error)) {
            throw conflict("Trạng thái yêu cầu bảo trì đã thay đổi");
        }
        throw error;
    }

    if (input.charge_tenant) {
        const repairFee = input.repair_fee;
        if (
            repairFee === undefined
            || !isPositiveDecimal12_2Amount(repairFee)
        ) {
            throw invalidRepairFee();
        }

        const invoiceCode = `MNT-${current.id}`;
        const contract = await transaction.rentalContract.findFirst({
            where: {
                apartment_id: current.apartment.id,
                tenant_id: current.tenant.id,
                status: ContractStatus.ACTIVE
            },
            select: { id: true }
        });

        if (!contract) {
            throw new AppError(
                409,
                "ACTIVE_CONTRACT_NOT_FOUND",
                "Không tìm thấy hợp đồng còn hiệu lực để lập hóa đơn sửa chữa"
            );
        }

        await transaction.invoice.create({
            data: {
                tenant: { connect: { id: current.tenant.id } },
                contract: { connect: { id: contract.id } },
                invoice_code: invoiceCode,
                due_date: new Date(),
                total_amount: repairFee,
                status: InvoiceStatus.UNPAID,
                items: {
                    create: [
                        {
                            item_name: `Phí sửa chữa: ${current.title}`,
                            quantity: 1,
                            unit_price: repairFee,
                            amount: repairFee
                        }
                    ]
                }
            }
        });

        if (current.tenant.user_id !== null) {
            await transaction.notification.create({
                data: {
                    user_id: current.tenant.user_id,
                    title: "Hóa đơn sửa chữa mới",
                    content:
                        `Hóa đơn ${invoiceCode} đã được tạo với tổng tiền ${repairFee}.`,
                    type: "INVOICE_CREATED"
                }
            });
        }
    }

    await createMaintenanceNotifications(
        transaction,
        current.tenant.user_id === null
            ? []
            : [current.tenant.user_id],
        "Yêu cầu sửa chữa đã hoàn tất",
        `${current.title} tại phòng `
        + `${current.apartment.room_number} đã được sửa xong`
    );

    return updated;
});

