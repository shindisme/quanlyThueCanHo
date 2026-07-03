import type { Role, UserStatus } from "@prisma/client";

export type Actor = {
    userId: number;
    role: Role;
    status: UserStatus;
    staffId?: number;
    buildingId?: number;
    tenantId?: number;
};
