import {
    Prisma,
    Role,
    UserStatus
} from "@prisma/client";
import { prisma } from "../config/database.js";
import { AppError } from "../errors/app-error.js";
import type {
    CreateStaffRequest,
    ListStaffRequest,
    UpdateStaffRequest
} from "../schemas/staff.schema.js";
import type { Actor } from "../types/auth.js";
import {
    createInitialCredential,
    nextStaffUsername
} from "./account.service.js";
import { getCurrentManagerAssignment } from "../utils/manager-scope.js";

const userSelect = {
    id: true,
    username: true,
    role: true,
    status: true,
    created_at: true
} satisfies Prisma.UserSelect;

const staffSelect = {
    id: true,
    user_id: true,
    building_id: true,
    full_name: true,
    phone: true,
    position: true,
    created_at: true,
    user: {
        select: userSelect
    },
    building: {
        select: {
            id: true,
            branch_name: true,
            address_new: true
        }
    }
} satisfies Prisma.StaffSelect;

const STAFF_USERNAME_RETRY_LIMIT = 3;

const notFound = () => new AppError(
    404,
    "NOT_FOUND",
    "Nhân viên không tồn tại"
);

const forbidden = (message: string) => new AppError(
    403,
    "FORBIDDEN",
    message
);

const accountForPosition = (position: string) =>
    position === "Quản lý"
        ? {
            role: Role.MANAGER,
            prefix: "quanly" as const
        }
        : {
            role: Role.STAFF,
            prefix: "nhanvien" as const
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
        || target === "username"
        || Array.isArray(target)
        && target.length === 1
        && target[0] === "username";
};

const managerStaffScope = (actor: Actor) => {
    const {
        buildingId,
        assignmentWhere
    } = getCurrentManagerAssignment(actor);

    return {
        building_id: buildingId,
        building: assignmentWhere,
        OR: [
            {
                user: {
                    is: null
                }
            },
            {
                user: {
                    is: {
                        role: {
                            not: Role.ADMIN
                        }
                    }
                }
            }
        ]
    } satisfies Prisma.StaffWhereInput;
};

export const getAllStaffService = async (
    filters: ListStaffRequest["query"],
    actor: Actor
) => {
    const conditions: Prisma.StaffWhereInput[] = [];

    if (actor.role === Role.MANAGER) {
        conditions.push(managerStaffScope(actor));
    } else if (filters.building_id !== undefined) {
        conditions.push({ building_id: filters.building_id });
    }

    if (filters.position !== undefined) {
        conditions.push({ position: filters.position });
    }

    if (filters.search !== undefined) {
        conditions.push({
            OR: [
                {
                    full_name: {
                        contains: filters.search,
                        mode: "insensitive"
                    }
                },
                { phone: { contains: filters.search } },
                {
                    user: {
                        is: {
                            username: {
                                contains: filters.search,
                                mode: "insensitive"
                            }
                        }
                    }
                }
            ]
        });
    }

    const where: Prisma.StaffWhereInput = conditions.length === 0
        ? {}
        : conditions.length === 1
            ? conditions[0]
            : { AND: conditions };
    const {
        page,
        limit
    } = filters;
    const [data, total] = await prisma.$transaction([
        prisma.staff.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { created_at: "desc" },
            select: staffSelect
        }),
        prisma.staff.count({ where })
    ]);

    return {
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

export const getStaffByIdService = async (
    id: number,
    actor: Actor
) => {
    const staff = actor.role === Role.MANAGER
        ? await prisma.staff.findFirst({
            where: {
                id,
                ...managerStaffScope(actor)
            },
            select: staffSelect
        })
        : await prisma.staff.findUnique({
            where: { id },
            select: staffSelect
        });

    if (!staff) {
        throw notFound();
    }

    return staff;
};

export const createStaffService = async (
    input: CreateStaffRequest["body"],
    actor: Actor
) => {
    const managerAssignment = actor.role === Role.MANAGER
        ? getCurrentManagerAssignment(actor)
        : undefined;
    const {
        role,
        prefix
    } = accountForPosition(input.position);
    const credential = await createInitialCredential();
    const {
        building_id: requestedBuildingId,
        ...staffData
    } = input;

    for (
        let attempt = 1;
        attempt <= STAFF_USERNAME_RETRY_LIMIT;
        attempt += 1
    ) {
        try {
            return await prisma.$transaction(async (transaction) => {
                const existingUsers = await transaction.user.findMany({
                    where: {
                        username: {
                            startsWith: prefix
                        }
                    },
                    select: { username: true }
                });
                const username = nextStaffUsername(
                    prefix,
                    existingUsers.map(({ username: value }) => value)
                );
                const user = await transaction.user.create({
                    data: {
                        username,
                        password_hash: credential.password_hash,
                        role,
                        status: UserStatus.ACTIVE
                    },
                    select: userSelect
                });
                const staff = await transaction.staff.create({
                    data: {
                        ...staffData,
                        user: {
                            connect: { id: user.id }
                        },
                        ...(managerAssignment
                            ? {
                                building: {
                                    connect:
                                        managerAssignment.buildingWhere
                                }
                            }
                            : requestedBuildingId === undefined
                                || requestedBuildingId === null
                                ? {}
                                : {
                                    building: {
                                        connect: {
                                            id: requestedBuildingId
                                        }
                                    }
                                })
                    },
                    select: staffSelect
                });

                return {
                    ...staff,
                    user,
                    initial_password:
                        credential.initial_password
                };
            });
        } catch (error) {
            if (
                isUsernameUniqueConflict(error)
                && attempt < STAFF_USERNAME_RETRY_LIMIT
            ) {
                continue;
            }

            throw error;
        }
    }

    throw new Error("Staff username retry exhausted");
};

export const updateStaffService = async (
    id: number,
    input: UpdateStaffRequest["body"],
    actor: Actor
) => {
    if (
        actor.role === Role.MANAGER
        && input.building_id !== undefined
        && input.building_id !== actor.buildingId
    ) {
        throw forbidden("Managers cannot transfer staff between buildings");
    }

    const {
        building_id: requestedBuildingId,
        ...staffData
    } = input;

    return prisma.$transaction(async (transaction) => {
        let staff;

        if (actor.role === Role.MANAGER) {
            const result = await transaction.staff.updateMany({
                where: {
                    id,
                    ...managerStaffScope(actor)
                },
                data: staffData
            });

            if (result.count === 0) {
                throw notFound();
            }

            staff = await transaction.staff.findFirst({
                where: {
                    id,
                    ...managerStaffScope(actor)
                },
                select: staffSelect
            });

            if (!staff) {
                throw notFound();
            }
        } else {
            const data: Prisma.StaffUpdateInput = {
                ...staffData,
                ...(requestedBuildingId === undefined
                    ? {}
                    : requestedBuildingId === null
                        ? { building: { disconnect: true } }
                        : {
                            building: {
                                connect: { id: requestedBuildingId }
                            }
                        })
            };

            staff = await transaction.staff.update({
                where: { id },
                data,
                select: staffSelect
            });
        }

        if (input.position === undefined || staff.user_id === null) {
            return staff;
        }

        const { role } = accountForPosition(input.position);
        const user = await transaction.user.update({
            where: actor.role === Role.MANAGER
                ? {
                    id: staff.user_id,
                    role: {
                        not: Role.ADMIN
                    }
                }
                : { id: staff.user_id },
            data: { role },
            select: userSelect
        });

        return {
            ...staff,
            user
        };
    });
};

export const deleteStaffService = async (
    id: number,
    actor: Actor
) => prisma.$transaction(async (transaction) => {
    const staff = await transaction.staff.delete({
        where: actor.role === Role.MANAGER
            ? {
                id,
                ...managerStaffScope(actor)
            }
            : { id },
        select: { user_id: true }
    });

    if (staff.user_id !== null) {
        await transaction.user.delete({
            where: actor.role === Role.MANAGER
                ? {
                    id: staff.user_id,
                    role: {
                        not: Role.ADMIN
                    }
                }
                : { id: staff.user_id }
        });
    }
});
