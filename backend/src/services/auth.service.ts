import {
    ContractStatus,
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
    "Tên đăng nhập hoặc mật khẩu không chính xác"
);

const forbiddenError = () => new AppError(
    403,
    "FORBIDDEN",
    "Bạn không có quyền thực hiện hành động này"
);

const userNotFoundError = () => new AppError(
    404,
    "NOT_FOUND",
    "Tài khoản không tồn tại"
);
const TENANT_ACCOUNT_ACTIVATION_PURPOSE = "tenant_account_activation";

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new AppError(
            500,
            "JWT_NOT_CONFIGURED",
            "Cấu hình xác thực JWT chưa được thiết lập"
        );
    }

    return secret;
};

const getTenantActivationJwtSecret = () => (
    process.env.TENANT_ACTIVATION_JWT_SECRET
    ?? `${getJwtSecret()}:tenant-account-activation`
);

const getBackendBaseUrl = () => (
    process.env.BACKEND_URL
    ?? `http://localhost:${process.env.PORT ?? 3000}`
).replace(/\/$/, "");

const invalidActivationToken = () => new AppError(
    400,
    "INVALID_ACTIVATION_TOKEN",
    "Link kích hoạt tài khoản không hợp lệ hoặc đã hết hạn"
);

export const buildTenantActivationUrl = (userId: number) => {
    const token = jwt.sign(
        { purpose: TENANT_ACCOUNT_ACTIVATION_PURPOSE },
        getTenantActivationJwtSecret(),
        {
            algorithm: "HS256",
            expiresIn: "7d",
            subject: String(userId)
        }
    );

    return `${getBackendBaseUrl()}/auth/activate?token=${encodeURIComponent(token)}`;
};

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
    },
    tenant: {
        select: {
            id: true,
            user_id: true,
            full_name: true,
            phone: true,
            email: true,
            citizen_id: true,
            contracts: {
                where: { status: ContractStatus.ACTIVE },
                orderBy: { start_date: "desc" },
                take: 1,
                select: {
                    id: true,
                    apartment_id: true,
                    tenant_id: true,
                    start_date: true,
                    end_date: true,
                    deposit_amount: true,
                    monthly_rent: true,
                    status: true,
                    contract_file: true,
                    signed_at: true,
                    created_at: true,
                    apartment: {
                        include: {
                            building: true
                        }
                    }
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
            "Cần có sự phân công quản lý tòa nhà cho các hoạt động của Quản lý"
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
            "Cần có sự phân công quản lý tòa nhà cho các hoạt động của Quản lý"
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

const deleteUserNotifications = (
    client: Prisma.TransactionClient,
    userId: number
) => client.notification.deleteMany({
    where: { user_id: userId }
});

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
        return prisma.$transaction(async (transaction) => {
            await deleteUserNotifications(transaction, id);

            return transaction.user.delete({
                where: { id }
            });
        });
    }

    const deleted = await prisma.$transaction(async (transaction) => {
        await deleteUserNotifications(transaction, id);

        return transaction.user.deleteMany({
            where: {
                id,
                role: {
                    not: Role.ADMIN
                },
                ...managerUserScope(actor, managerBuildingId)
            }
        });
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
        tenant: user.tenant ?? null,
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
            "Tài khoản này đã bị vô hiệu hóa"
        );
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new AppError(
            500,
            "JWT_NOT_CONFIGURED",
            "Cấu hình xác thực JWT chưa được thiết lập"
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

export const logoutService = async (actor: Actor) => {
    if (actor.role !== Role.TENANT || actor.tenantId === undefined) {
        return {
            logged_out: true,
            banned: false
        };
    }

    const reviewedEndedContract = await prisma.rentalContract.findFirst({
        where: {
            tenant_id: actor.tenantId,
            status: ContractStatus.ENDED,
            apartment: {
                reviews: {
                    some: { tenant_id: actor.tenantId }
                }
            }
        },
        select: { id: true }
    });

    if (!reviewedEndedContract) {
        return {
            logged_out: true,
            banned: false
        };
    }

    await prisma.user.update({
        where: { id: actor.userId },
        data: { status: UserStatus.BANNED },
        select: { id: true }
    });

    return {
        logged_out: true,
        banned: true
    };
};
export const activateTenantAccountService = async (token: string) => {
    let payload: { sub?: unknown; purpose?: unknown };

    try {
        const verified = jwt.verify(
            token,
            getTenantActivationJwtSecret(),
            { algorithms: ["HS256"] }
        );

        if (typeof verified === "string") {
            throw invalidActivationToken();
        }

        payload = verified;
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }

        throw invalidActivationToken();
    }

    if (payload.purpose !== TENANT_ACCOUNT_ACTIVATION_PURPOSE) {
        throw invalidActivationToken();
    }

    const userId = Number(payload.sub);
    if (!Number.isInteger(userId) || userId <= 0) {
        throw invalidActivationToken();
    }

    const activated = await prisma.$transaction(async (tx) => {
        const updated = await tx.user.updateMany({
            where: {
                id: userId,
                role: Role.TENANT,
                status: UserStatus.INACTIVE
            },
            data: { status: UserStatus.ACTIVE }
        });

        if (updated.count > 0) {
            await tx.tenant.updateMany({
                where: { user_id: userId },
                data: { is_verified: true }
            });
            return true;
        }

        const user = await tx.user.findUnique({
            where: { id: userId },
            select: {
                role: true,
                status: true
            }
        });

        if (
            user?.role === Role.TENANT
            && user.status === UserStatus.ACTIVE
        ) {
            await tx.tenant.updateMany({
                where: { user_id: userId },
                data: { is_verified: true }
            });
            return true;
        }

        return false;
    });

    if (activated) {
        return { activated: true };
    }

    throw invalidActivationToken();
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
        throw new AppError(404, "NOT_FOUND", "Tài khoản không tồn tại");
    }

    const isMatch = await bcrypt.compare(oldPass, user.password_hash);

    if (!isMatch) {
        throw new AppError(
            400,
            "INVALID_PASSWORD",
            "Mật khẩu hiện tại không chính xác"
        );
    }

    const password_hash = await bcrypt.hash(newPass, 10);

    return prisma.user.update({
        where: { id },
        data: { password_hash }
    });
};
