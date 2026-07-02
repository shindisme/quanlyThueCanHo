import {
    Prisma,
    Role,
    UserStatus
} from "@prisma/client";
import { prisma } from "../config/database.js";
import { AppError } from "../errors/app-error.js";
import type {
    CreateTenantRequest,
    UpdateTenantRequest
} from "../schemas/tenant.schema.js";
import type { Actor } from "../types/auth.js";
import {
    createInitialCredential,
    tenantUsername
} from "./account.service.js";
import { getCurrentManagerAssignment } from "./manager-scope.js";

const tenantSelect = {
    id: true,
    user_id: true,
    onboarding_building_id: true,
    full_name: true,
    phone: true,
    email: true,
    date_of_birth: true,
    citizen_id: true,
    address: true,
    is_verified: true,
    created_at: true,
    user: {
        select: {
            id: true,
            username: true,
            role: true,
            status: true,
            created_at: true
        }
    }
} satisfies Prisma.TenantSelect;

const notFound = () => new AppError(
    404,
    "NOT_FOUND",
    "Tenant was not found"
);

const TENANT_USERNAME_RETRY_LIMIT = 3;

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

const getManagerTenantScope = (
    actor: Actor
) => {
    const {
        buildingId,
        assignmentWhere
    } = getCurrentManagerAssignment(actor);

    return {
        OR: [
            {
                onboarding_building_id: buildingId,
                onboarding_building: assignmentWhere
            },
            {
                contracts: {
                    some: {
                        apartment: {
                            building_id: buildingId,
                            building: assignmentWhere
                        }
                    }
                }
            }
        ]
    } satisfies Prisma.TenantWhereInput;
};

export const createTenant = async (
    input: CreateTenantRequest["body"],
    actor: Actor
) => {
    const managerAssignment = actor.role === Role.MANAGER
        ? getCurrentManagerAssignment(actor)
        : undefined;
    const usernameBase = tenantUsername(input.citizen_id);
    const credential = await createInitialCredential();
    const {
        onboarding_building_id: onboardingBuildingId,
        ...tenantData
    } = input;

    for (
        let attempt = 1;
        attempt <= TENANT_USERNAME_RETRY_LIMIT;
        attempt += 1
    ) {
        try {
            return await prisma.$transaction(async (transaction) => {
                const existingUsers = await transaction.user.findMany({
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
                const user = await transaction.user.create({
                    data: {
                        username,
                        password_hash: credential.password_hash,
                        role: Role.TENANT,
                        status: UserStatus.ACTIVE
                    },
                    select: {
                        id: true,
                        username: true,
                        role: true,
                        status: true,
                        created_at: true
                    }
                });
                const tenant = await transaction.tenant.create({
                    data: {
                        ...tenantData,
                        ...(managerAssignment
                            ? { is_verified: false }
                            : {}),
                        user: {
                            connect: { id: user.id }
                        },
                        ...(managerAssignment
                            ? {
                                onboarding_building: {
                                    connect:
                                        managerAssignment.buildingWhere
                                }
                            }
                            : onboardingBuildingId === undefined
                                || onboardingBuildingId === null
                                ? {}
                                : {
                                    onboarding_building: {
                                        connect: {
                                            id: onboardingBuildingId
                                        }
                                    }
                                })
                    },
                    select: tenantSelect
                });

                return {
                    ...tenant,
                    user,
                    initial_password:
                        credential.initial_password
                };
            });
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

export const getTenants = async (
    page: number,
    limit: number,
    search: string | undefined,
    actor: Actor
) => {
    const filters: Prisma.TenantWhereInput[] = [];

    if (actor.role === Role.MANAGER) {
        filters.push(getManagerTenantScope(actor));
    }

    if (search) {
        filters.push({
            OR: [
                {
                    full_name: {
                        contains: search,
                        mode: "insensitive"
                    }
                },
                { phone: { contains: search } },
                {
                    email: {
                        contains: search,
                        mode: "insensitive"
                    }
                },
                { citizen_id: { contains: search } }
            ]
        });
    }

    const where: Prisma.TenantWhereInput = filters.length > 0
        ? { AND: filters }
        : {};
    const [data, total] = await prisma.$transaction([
        prisma.tenant.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { created_at: "desc" },
            select: tenantSelect
        }),
        prisma.tenant.count({ where })
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

export const getTenantById = async (
    id: number,
    actor: Actor
) => {
    const query = {
        select: tenantSelect
    };
    let tenant;

    if (actor.role === Role.TENANT) {
        if (actor.tenantId === undefined) {
            throw new AppError(
                403,
                "TENANT_PROFILE_REQUIRED",
                "A tenant profile is required"
            );
        }

        if (id !== actor.tenantId) {
            throw notFound();
        }

        tenant = await prisma.tenant.findFirst({
            ...query,
            where: {
                id,
                user_id: actor.userId
            }
        });
    } else if (actor.role === Role.MANAGER) {
        tenant = await prisma.tenant.findFirst({
            ...query,
            where: {
                id,
                ...getManagerTenantScope(actor)
            }
        });
    } else {
        tenant = await prisma.tenant.findUnique({
            ...query,
            where: { id }
        });
    }

    if (!tenant) {
        throw notFound();
    }

    return tenant;
};

export const updateTenant = async (
    id: number,
    input: UpdateTenantRequest["body"],
    actor: Actor
) => {
    if (
        actor.role === Role.MANAGER
        && input.is_verified !== undefined
    ) {
        throw new AppError(
            403,
            "FORBIDDEN",
            "Managers cannot change tenant verification"
        );
    }

    const {
        onboarding_building_id: onboardingBuildingId,
        ...tenantData
    } = input;

    if (
        actor.role === Role.MANAGER
        && Object.keys(tenantData).length === 0
    ) {
        throw new AppError(
            400,
            "VALIDATION_ERROR",
            "No Manager-editable field was provided"
        );
    }

    const data: Prisma.TenantUpdateInput = actor.role === Role.ADMIN
        ? {
            ...tenantData,
            ...(onboardingBuildingId === undefined
                ? {}
                : onboardingBuildingId === null
                    ? { onboarding_building: { disconnect: true } }
                    : {
                        onboarding_building: {
                            connect: { id: onboardingBuildingId }
                        }
                    })
        }
        : tenantData;
    const where: Prisma.TenantWhereUniqueInput =
        actor.role === Role.MANAGER
            ? {
                ...getManagerTenantScope(actor),
                id
            }
            : { id };

    return prisma.tenant.update({
        where,
        data,
        select: tenantSelect
    });
};

export const deleteTenant = async (
    id: number,
    actor: Actor
) => prisma.$transaction(async (transaction) => {
    const where: Prisma.TenantWhereUniqueInput =
        actor.role === Role.MANAGER
            ? {
                ...getManagerTenantScope(actor),
                id
            }
            : { id };
    const tenant = await transaction.tenant.delete({
        where,
        select: { user_id: true }
    });

    if (tenant.user_id !== null) {
        await transaction.user.delete({
            where: { id: tenant.user_id }
        });
    }
});
