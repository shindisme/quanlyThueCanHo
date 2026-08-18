import {
    Prisma,
    Role,
    UserStatus
} from "@prisma/client";
import { AppError } from "../errors/app-error.js";
import type { Actor } from "../types/auth.js";

const getCurrentAssignment = (
    actor: Actor,
    requiredRole: Role
) => {
    if (
        actor.staffId === undefined
        || actor.buildingId === undefined
    ) {
        throw new AppError(
            403,
            "MANAGER_BUILDING_REQUIRED",
            "Quản lý cần được phân công tòa nhà hiện tại"
        );
    }

    const assignmentWhere = {
        assigned_staff: {
            some: {
                id: actor.staffId,
                user_id: actor.userId,
                user: {
                    is: {
                        id: actor.userId,
                        role: requiredRole,
                        status: UserStatus.ACTIVE
                    }
                }
            }
        }
    } satisfies Prisma.BuildingWhereInput;

    return {
        buildingId: actor.buildingId,
        assignmentWhere,
        buildingWhere: {
            id: actor.buildingId,
            ...assignmentWhere
        } satisfies Prisma.BuildingWhereUniqueInput
    };
};

export const getCurrentManagerAssignment = (actor: Actor) =>
    getCurrentAssignment(actor, Role.MANAGER);

export const getManagerApartmentScope = (actor: Actor) => {
    const assignment = getCurrentManagerAssignment(actor);

    return {
        building_id: assignment.buildingId,
        building: assignment.assignmentWhere
    } satisfies Prisma.ApartmentWhereInput;
};

export const getManagerTenantScope = (actor: Actor) => {
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
            },
            {
                reservations: {
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

export const getCurrentStaffAssignment = (actor: Actor) =>
    getCurrentAssignment(actor, Role.STAFF);

