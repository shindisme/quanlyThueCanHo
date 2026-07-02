import {
    Role,
    UserStatus,
    type Prisma
} from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../config/database.js";
import { AppError } from "../errors/app-error.js";
import type { Actor } from "../types/auth.js";
import { createInitialCredential } from "./account.service.js";

const DUMMY_PASSWORD_HASH =
    "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

const invalidCredentialsError = () => new AppError(
    401,
    "INVALID_CREDENTIALS",
    "Invalid username or password"
);

const forbiddenError = () => new AppError(
    403,
    "FORBIDDEN",
    "You do not have permission to perform this action"
);

const userNotFoundError = () => new AppError(
    404,
    "NOT_FOUND",
    "User was not found"
);

const userSummarySelect = {
    id: true,
    username: true,
    role: true,
    status: true,
    created_at: true,
    staff: {
        select: {
            building: {
                select: {
                    id: true,
                    branch_name: true,
                    address_new: true
                }
            }
        }
    }
} satisfies Prisma.UserSelect;

const userMutationSelect = {
    id: true,
    username: true,
    role: true,
    status: true,
    created_at: true
} satisfies Prisma.UserSelect;

const managerUserScope = (
    actor: Actor,
    buildingId: number
): Prisma.UserWhereInput => {
    if (actor.staffId === undefined) {
        throw new AppError(
            403,
            "MANAGER_BUILDING_REQUIRED",
            "A building assignment is required for Manager operations"
        );
    }

    const liveManagerAssignment = {
        assigned_staff: {
            some: {
                id: actor.staffId,
                user_id: actor.userId,
                user: {
                    is: {
                        id: actor.userId,
                        role: Role.MANAGER,
                        status: UserStatus.ACTIVE
                    }
                }
            }
        }
    } satisfies Prisma.BuildingWhereInput;

    return {
        OR: [
            {
                staff: {
                    is: {
                        building_id: buildingId,
                        building: liveManagerAssignment
                    }
                }
            },
            {
                tenant: {
                    is: {
                        onboarding_building_id: buildingId,
                        onboarding_building:
                            liveManagerAssignment
                    }
                }
            },
            {
                tenant: {
                    is: {
                        contracts: {
                            some: {
                                apartment: {
                                    building_id: buildingId,
                                    building:
                                        liveManagerAssignment
                                }
                            }
                        }
                    }
                }
            }
        ]
    };
};

const getManagerBuildingId = (actor: Actor) => {
    if (actor.role === Role.ADMIN) {
        return undefined;
    }

    if (actor.role !== Role.MANAGER) {
        throw forbiddenError();
    }

    if (
        actor.staffId === undefined
        || actor.buildingId === undefined
    ) {
        throw new AppError(
            403,
            "MANAGER_BUILDING_REQUIRED",
            "A building assignment is required for Manager operations"
        );
    }

    return actor.buildingId;
};

const assertAssignableRole = (
    actor: Actor,
    role: Role | undefined
) => {
    if (actor.role === Role.MANAGER && role === Role.ADMIN) {
        throw forbiddenError();
    }
};

const assertCanManageTarget = async (
    actor: Actor,
    targetId: number,
    managerBuildingId: number | undefined
) => {
    const target = await prisma.user.findUnique({
        where: { id: targetId },
        select: {
            id: true,
            role: true
        }
    });

    if (!target) {
        throw userNotFoundError();
    }

    if (actor.role === Role.MANAGER && target.role === Role.ADMIN) {
        throw forbiddenError();
    }

    if (managerBuildingId === undefined) {
        return;
    }

    const scopedTarget = await prisma.user.findFirst({
        where: {
            id: targetId,
            role: {
                not: Role.ADMIN
            },
            ...managerUserScope(actor, managerBuildingId)
        },
        select: { id: true }
    });

    if (!scopedTarget) {
        throw userNotFoundError();
    }
};

export const createAccountByAdminService = async (
    actor: Actor,
    data: {
    username: string;
    role: Role;
    }
) => {
    if (actor.role !== Role.ADMIN) {
        throw forbiddenError();
    }

    const credential = await createInitialCredential();

    const user = await prisma.user.create({
        data: {
            username: data.username,
            role: data.role,
            password_hash: credential.password_hash,
            status: UserStatus.ACTIVE
        },
        select: { id: true }
    });

    return {
        userId: user.id,
        initial_password: credential.initial_password
    };
};

export const deleteUserService = async (actor: Actor, id: number) => {
    const managerBuildingId = getManagerBuildingId(actor);
    await assertCanManageTarget(actor, id, managerBuildingId);

    if (managerBuildingId === undefined) {
        return prisma.user.delete({
            where: { id }
        });
    }

    const deleted = await prisma.user.deleteMany({
        where: {
            id,
            role: {
                not: Role.ADMIN
            },
            ...managerUserScope(actor, managerBuildingId)
        }
    });

    if (deleted.count === 0) {
        throw userNotFoundError();
    }

    return deleted;
};

export const getAllUsersService = async (actor: Actor) => {
    const managerBuildingId = getManagerBuildingId(actor);
    const users = managerBuildingId === undefined
        ? await prisma.user.findMany({
            select: userSummarySelect
        })
        : await prisma.user.findMany({
            where: {
                role: {
                    not: Role.ADMIN
                },
                ...managerUserScope(actor, managerBuildingId)
            },
            select: userSummarySelect
        });

    return users.map((user) => ({
        id: user.id,
        username: user.username,
        role: user.role,
        status: user.status,
        created_at: user.created_at,
        managed_building: user.staff?.building
            ? {
                id: user.staff.building.id,
                branch_name: user.staff.building.branch_name,
                address_new: user.staff.building.address_new
            }
            : null
    }));
};

export const loginService = async (username: string, password: string) => {
    const user = await prisma.user.findUnique({
        where: { username }
    });
    const isMatch = await bcrypt.compare(
        password,
        user?.password_hash ?? DUMMY_PASSWORD_HASH
    );

    if (!user || !isMatch) {
        throw invalidCredentialsError();
    }

    if (user.status !== UserStatus.ACTIVE) {
        throw new AppError(
            403,
            "ACCOUNT_DISABLED",
            "This account is disabled"
        );
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new AppError(
            500,
            "JWT_NOT_CONFIGURED",
            "JWT authentication is not configured"
        );
    }

    const token = jwt.sign(
        {},
        secret,
        {
            algorithm: "HS256",
            expiresIn: "24h",
            subject: String(user.id)
        }
    );

    return { token, role: user.role };
};

export const updateUserService = async (
    actor: Actor,
    id: number,
    data: {
        username?: string;
        role?: Role;
        status?: UserStatus;
    }
) => {
    const managerBuildingId = getManagerBuildingId(actor);
    assertAssignableRole(actor, data.role);

    const updateData: {
        username?: string;
        role?: Role;
        status?: UserStatus;
    } = {};

    if (data.username !== undefined) {
        updateData.username = data.username;
    }

    if (data.role !== undefined) {
        updateData.role = data.role;
    }

    if (data.status !== undefined) {
        updateData.status = data.status;
    }

    await assertCanManageTarget(actor, id, managerBuildingId);

    if (managerBuildingId === undefined) {
        return prisma.user.update({
            where: { id },
            data: updateData,
            select: userMutationSelect
        });
    }

    const updated = await prisma.user.updateMany({
        where: {
            id,
            role: {
                not: Role.ADMIN
            },
            ...managerUserScope(actor, managerBuildingId)
        },
        data: updateData
    });

    if (updated.count === 0) {
        throw userNotFoundError();
    }

    const user = await prisma.user.findUnique({
        where: { id },
        select: userMutationSelect
    });

    if (!user) {
        throw userNotFoundError();
    }

    return user;
};

export const resetPasswordByAdminService = async (
    actor: Actor,
    id: number
) => {
    const managerBuildingId = getManagerBuildingId(actor);
    await assertCanManageTarget(actor, id, managerBuildingId);
    const credential = await createInitialCredential();

    if (managerBuildingId === undefined) {
        await prisma.user.update({
            where: { id },
            data: {
                password_hash: credential.password_hash
            }
        });
    } else {
        const updated = await prisma.user.updateMany({
            where: {
                id,
                role: {
                    not: Role.ADMIN
                },
                ...managerUserScope(actor, managerBuildingId)
            },
            data: {
                password_hash: credential.password_hash
            }
        });

        if (updated.count === 0) {
            throw userNotFoundError();
        }
    }

    return {
        initial_password: credential.initial_password
    };
};

export const changePasswordService = async (
    id: number,
    oldPass: string,
    newPass: string
) => {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
        throw new AppError(404, "NOT_FOUND", "User was not found");
    }

    const isMatch = await bcrypt.compare(oldPass, user.password_hash);

    if (!isMatch) {
        throw new AppError(
            400,
            "INVALID_PASSWORD",
            "Current password is incorrect"
        );
    }

    const password_hash = await bcrypt.hash(newPass, 10);

    return prisma.user.update({
        where: { id },
        data: { password_hash }
    });
};
