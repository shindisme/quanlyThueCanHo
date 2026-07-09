import {
    describe,
    expect,
    it,
    vi,
    beforeEach
} from "vitest";
import {
    Role,
    UserStatus
} from "@prisma/client";
import type { Actor } from "../types/auth.js";

const { occupant } = vi.hoisted(() => ({
    occupant: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        updateMany: vi.fn(),
        deleteMany: vi.fn()
    }
}));

vi.mock("../config/database.js", () => ({
    prisma: { occupant }
}));

const tenantService = await import("./tenant.service.js");

const actor: Actor = {
    userId: 1,
    role: Role.TENANT,
    status: UserStatus.ACTIVE,
    tenantId: 7
};

describe("tenant occupants", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("creates an occupant for the authenticated tenant", async () => {
        const created = { id: 1, tenant_id: 7 };
        occupant.create.mockResolvedValue(created);

        await expect(tenantService.createMyOccupant({
            full_name: "Nguyễn Văn A",
            citizen_id: "123456789012",
            date_of_birth: null,
            phone: "0912345678"
        }, actor)).resolves.toBe(created);

        expect(occupant.create).toHaveBeenCalledWith({
            data: {
                tenant: { connect: { id: 7 } },
                full_name: "Nguyễn Văn A",
                citizen_id: "123456789012",
                date_of_birth: null,
                phone: "0912345678"
            },
            select: expect.any(Object)
        });
    });

    it("updates only an occupant owned by the authenticated tenant", async () => {
        const updated = { id: 5, tenant_id: 7, phone: "0987654321" };
        occupant.updateMany.mockResolvedValue({ count: 1 });
        occupant.findFirst.mockResolvedValue(updated);

        await expect(tenantService.updateMyOccupant(
            5,
            { phone: "0987654321" },
            actor
        )).resolves.toBe(updated);

        expect(occupant.updateMany).toHaveBeenCalledWith({
            where: {
                id: 5,
                tenant_id: 7
            },
            data: { phone: "0987654321" }
        });
    });

    it("deletes only an occupant owned by the authenticated tenant", async () => {
        occupant.deleteMany.mockResolvedValue({ count: 1 });

        await expect(
            tenantService.deleteMyOccupant(5, actor)
        ).resolves.toEqual({ deleted: true });

        expect(occupant.deleteMany).toHaveBeenCalledWith({
            where: {
                id: 5,
                tenant_id: 7
            }
        });
    });
});
