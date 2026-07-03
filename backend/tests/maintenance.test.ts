import {
    Priority,
    RequestStatus,
    Role,
    UserStatus
} from "@prisma/client";
import jwt from "jsonwebtoken";
import request from "supertest";
import {
    beforeEach,
    describe,
    expect,
    it
} from "vitest";
import app from "../src/app.js";
import { prismaMock } from "./setup.js";

const MANAGER_USER_ID = 101;
const MANAGER_STAFF_ID = 201;
const BUILDING_ID = 301;
const TENANT_USER_ID = 102;
const TENANT_ID = 202;
const APARTMENT_ID = 401;
const REQUEST_ID = 501;
const STAFF_USER_ID = 103;
const TECHNICIAN_ID = 203;

const authorizationFor = (userId: number) => `Bearer ${jwt.sign(
    {},
    process.env.JWT_SECRET!,
    {
        algorithm: "HS256",
        subject: String(userId)
    }
)}`;

const authenticateTenant = () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
        id: TENANT_USER_ID,
        role: Role.TENANT,
        status: UserStatus.ACTIVE,
        staff: null,
        tenant: { id: TENANT_ID }
    } as never);

    return authorizationFor(TENANT_USER_ID);
};

const maintenanceRow = (
    status: RequestStatus = RequestStatus.PENDING
) => ({
    id: REQUEST_ID,
    tenant_id: TENANT_ID,
    apartment_id: APARTMENT_ID,
    assigned_staff_id: null,
    title: "Rò rỉ nước",
    description: "Ống nước dưới bồn rửa bị rò",
    image_url: null,
    priority: Priority.HIGH,
    status,
    scheduled_at: null,
    unable_reason: null,
    created_at: new Date("2026-07-03T01:00:00.000Z"),
    updated_at: new Date("2026-07-03T01:00:00.000Z"),
    tenant: {
        id: TENANT_ID,
        user_id: TENANT_USER_ID,
        full_name: "Nguyễn Văn A"
    },
    apartment: {
        id: APARTMENT_ID,
        building_id: BUILDING_ID,
        floor: 3,
        room_number: "302",
        building: {
            id: BUILDING_ID,
            branch_name: "Tòa A",
            address_new: "1 Nguyễn Huệ"
        }
    },
    assigned_staff: null
});

const assignedMaintenanceRow = (
    status: RequestStatus = RequestStatus.PROCESSING
) => ({
    ...maintenanceRow(status),
    assigned_staff_id: TECHNICIAN_ID,
    scheduled_at: new Date("2030-01-10T02:00:00.000Z"),
    assigned_staff: {
        id: TECHNICIAN_ID,
        full_name: "Trần Kỹ Thuật",
        phone: "0909000000",
        position: "Kỹ thuật",
        building_id: BUILDING_ID
    }
});

const authenticateManager = () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
        id: MANAGER_USER_ID,
        role: Role.MANAGER,
        status: UserStatus.ACTIVE,
        staff: {
            id: MANAGER_STAFF_ID,
            building_id: BUILDING_ID
        },
        tenant: null
    } as never);

    return authorizationFor(MANAGER_USER_ID);
};

const authenticateStaff = () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
        id: STAFF_USER_ID,
        role: Role.STAFF,
        status: UserStatus.ACTIVE,
        staff: {
            id: TECHNICIAN_ID,
            building_id: BUILDING_ID
        },
        tenant: null
    } as never);

    return authorizationFor(STAFF_USER_ID);
};

beforeEach(() => {
    prismaMock.$transaction.mockImplementation(
        async (operation: unknown) => (
            operation as (
                client: typeof prismaMock
            ) => Promise<unknown>
        )(prismaMock)
    );
});

describe("maintenance API", () => {
    it("mounts the authenticated maintenance API", async () => {
        const response = await request(app).get("/maintenance");

        expect(response.status).toBe(401);
        expect(response.body.error.code).toBe(
            "AUTHENTICATION_REQUIRED"
        );
    });

    it("scopes a Manager list to the assigned building", async () => {
        const authorization = authenticateManager();
        prismaMock.maintenanceRequest.findMany
            .mockResolvedValueOnce([]);
        prismaMock.maintenanceRequest.count.mockResolvedValueOnce(0);

        const response = await request(app)
            .get("/maintenance?status=PENDING")
            .set("Authorization", authorization);

        expect(response.status).toBe(200);
        expect(response.body.meta.pagination).toEqual({
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0
        });
        expect(prismaMock.maintenanceRequest.findMany)
            .toHaveBeenCalledWith(expect.objectContaining({
                where: {
                    AND: [
                        {
                            apartment: {
                                building_id: BUILDING_ID,
                                building: expect.any(Object)
                            }
                        },
                        { status: RequestStatus.PENDING }
                    ]
                }
            }));
    });

    it("creates through the Tenant's active apartment contract", async () => {
        const authorization = authenticateTenant();
        prismaMock.maintenanceRequest.create.mockResolvedValueOnce(
            maintenanceRow() as never
        );

        const response = await request(app)
            .post("/maintenance")
            .set("Authorization", authorization)
            .send({
                apartment_id: APARTMENT_ID,
                title: " Rò rỉ nước ",
                description: " Ống nước dưới bồn rửa bị rò ",
                priority: Priority.HIGH
            });

        expect(response.status).toBe(201);
        expect(prismaMock.maintenanceRequest.create)
            .toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    title: "Rò rỉ nước",
                    description: "Ống nước dưới bồn rửa bị rò",
                    tenant: {
                        connect: {
                            id: TENANT_ID,
                            user_id: TENANT_USER_ID
                        }
                    },
                    apartment: {
                        connect: {
                            id: APARTMENT_ID,
                            contracts: {
                                some: {
                                    tenant_id: TENANT_ID,
                                    status: "ACTIVE"
                                }
                            }
                        }
                    }
                })
            }));
    });

    it("cancels the owner's PENDING request with PUT", async () => {
        const authorization = authenticateTenant();
        const current = maintenanceRow();
        prismaMock.maintenanceRequest.findFirst.mockResolvedValueOnce(
            current as never
        );
        prismaMock.maintenanceRequest.update.mockResolvedValueOnce({
            ...current,
            status: RequestStatus.CANCELLED
        } as never);

        const response = await request(app)
            .put(`/maintenance/${REQUEST_ID}/cancel`)
            .set("Authorization", authorization)
            .send({});

        expect(response.status).toBe(200);
        expect(response.body.data.status).toBe(
            RequestStatus.CANCELLED
        );
        expect(prismaMock.maintenanceRequest.update)
            .toHaveBeenCalledWith(expect.objectContaining({
                where: {
                    id: REQUEST_ID,
                    tenant_id: TENANT_ID,
                    status: RequestStatus.PENDING
                },
                data: { status: RequestStatus.CANCELLED }
            }));
    });

    it("rejects Tenant cancellation after confirmation", async () => {
        const authorization = authenticateTenant();
        prismaMock.maintenanceRequest.findFirst.mockResolvedValueOnce(
            maintenanceRow(RequestStatus.PROCESSING) as never
        );

        const response = await request(app)
            .put(`/maintenance/${REQUEST_ID}/cancel`)
            .set("Authorization", authorization)
            .send({});

        expect(response.status).toBe(409);
        expect(response.body.error.code).toBe(
            "INVALID_STATUS_TRANSITION"
        );
        expect(prismaMock.maintenanceRequest.update)
            .not.toHaveBeenCalled();
    });

    it.each([
        RequestStatus.PENDING,
        RequestStatus.NEEDS_RESCHEDULE
    ])("confirms %s with a same-building technician", async (status) => {
        const authorization = authenticateManager();
        const current = maintenanceRow(status);
        const technician = {
            id: TECHNICIAN_ID,
            user_id: STAFF_USER_ID,
            building_id: BUILDING_ID,
            full_name: "Trần Kỹ Thuật",
            phone: "0909000000",
            position: "Kỹ thuật",
            user: {
                id: STAFF_USER_ID,
                role: Role.STAFF,
                status: UserStatus.ACTIVE
            }
        };
        prismaMock.maintenanceRequest.findFirst.mockResolvedValueOnce(
            current as never
        );
        prismaMock.staff.findFirst.mockResolvedValueOnce(
            technician as never
        );
        prismaMock.maintenanceRequest.update.mockResolvedValueOnce({
            ...current,
            status: RequestStatus.PROCESSING,
            assigned_staff_id: TECHNICIAN_ID,
            scheduled_at: new Date("2030-01-10T02:00:00.000Z"),
            assigned_staff: technician
        } as never);
        prismaMock.notification.create.mockResolvedValueOnce(
            {} as never
        );

        const response = await request(app)
            .put(`/maintenance/${REQUEST_ID}/confirm`)
            .set("Authorization", authorization)
            .send({
                assigned_staff_id: TECHNICIAN_ID,
                scheduled_at: "2030-01-10T09:00:00+07:00"
            });

        expect(response.status).toBe(200);
        expect(prismaMock.maintenanceRequest.update)
            .toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    id: REQUEST_ID,
                    status
                }),
                data: expect.objectContaining({
                    status: RequestStatus.PROCESSING,
                    unable_reason: null
                })
            }));
        expect(prismaMock.notification.create)
            .toHaveBeenCalledWith({
                data: expect.objectContaining({
                    user_id: TENANT_USER_ID,
                    type: "MAINTENANCE"
                })
            });
    });

    it("rejects a non-technical assignment", async () => {
        const authorization = authenticateManager();
        prismaMock.maintenanceRequest.findFirst.mockResolvedValueOnce(
            maintenanceRow() as never
        );
        prismaMock.staff.findFirst.mockResolvedValueOnce(null);

        const response = await request(app)
            .put(`/maintenance/${REQUEST_ID}/confirm`)
            .set("Authorization", authorization)
            .send({
                assigned_staff_id: TECHNICIAN_ID,
                scheduled_at: "2030-01-10T09:00:00+07:00"
            });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe(
            "INVALID_TECHNICIAN"
        );
        expect(prismaMock.maintenanceRequest.update)
            .not.toHaveBeenCalled();
    });

    it("records an unable reason and notifies Tenant and Manager", async () => {
        const authorization = authenticateStaff();
        const current = assignedMaintenanceRow();
        prismaMock.maintenanceRequest.findFirst.mockResolvedValueOnce(
            current as never
        );
        prismaMock.maintenanceRequest.update.mockResolvedValueOnce({
            ...current,
            status: RequestStatus.NEEDS_RESCHEDULE,
            unable_reason: "Không liên hệ được cư dân"
        } as never);
        prismaMock.user.findMany.mockResolvedValueOnce([
            { id: MANAGER_USER_ID }
        ] as never);
        prismaMock.notification.createMany.mockResolvedValueOnce({
            count: 2
        });

        const response = await request(app)
            .put(`/maintenance/${REQUEST_ID}/unable`)
            .set("Authorization", authorization)
            .send({ reason: " Không liên hệ được cư dân " });

        expect(response.status).toBe(200);
        expect(response.body.data.status).toBe(
            RequestStatus.NEEDS_RESCHEDULE
        );
        expect(prismaMock.maintenanceRequest.update)
            .toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    assigned_staff: expect.objectContaining({
                        position: "Kỹ thuật",
                        user_id: STAFF_USER_ID
                    })
                }),
                data: {
                    status: RequestStatus.NEEDS_RESCHEDULE,
                    unable_reason: "Không liên hệ được cư dân"
                }
            }));
        expect(prismaMock.notification.createMany)
            .toHaveBeenCalledWith({
                data: expect.arrayContaining([
                    expect.objectContaining({
                        user_id: TENANT_USER_ID,
                        type: "MAINTENANCE"
                    }),
                    expect.objectContaining({
                        user_id: MANAGER_USER_ID,
                        type: "MAINTENANCE"
                    })
                ])
            });
    });

    it("lets only the assigned technician complete the request", async () => {
        const authorization = authenticateStaff();
        const current = assignedMaintenanceRow();
        prismaMock.maintenanceRequest.findFirst.mockResolvedValueOnce(
            current as never
        );
        prismaMock.maintenanceRequest.update.mockResolvedValueOnce({
            ...current,
            status: RequestStatus.DONE
        } as never);
        prismaMock.notification.createMany.mockResolvedValueOnce({
            count: 1
        });

        const response = await request(app)
            .put(`/maintenance/${REQUEST_ID}/complete`)
            .set("Authorization", authorization)
            .send({});

        expect(response.status).toBe(200);
        expect(response.body.data.status).toBe(RequestStatus.DONE);
        expect(prismaMock.notification.createMany)
            .toHaveBeenCalledWith({
                data: [expect.objectContaining({
                    user_id: TENANT_USER_ID,
                    type: "MAINTENANCE"
                })]
            });
    });

    it("hides requests assigned to another technician", async () => {
        const authorization = authenticateStaff();
        prismaMock.maintenanceRequest.findFirst.mockResolvedValueOnce(
            null
        );

        const response = await request(app)
            .put(`/maintenance/${REQUEST_ID}/complete`)
            .set("Authorization", authorization)
            .send({});

        expect(response.status).toBe(404);
        expect(prismaMock.maintenanceRequest.findFirst)
            .toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    id: REQUEST_ID,
                    assigned_staff_id: TECHNICIAN_ID,
                    assigned_staff: expect.objectContaining({
                        position: "Kỹ thuật",
                        user_id: STAFF_USER_ID
                    })
                })
            }));
        expect(prismaMock.maintenanceRequest.update)
            .not.toHaveBeenCalled();
    });

    it("rejects a technician outcome after processing ended", async () => {
        const authorization = authenticateStaff();
        prismaMock.maintenanceRequest.findFirst.mockResolvedValueOnce(
            assignedMaintenanceRow(RequestStatus.DONE) as never
        );

        const response = await request(app)
            .put(`/maintenance/${REQUEST_ID}/complete`)
            .set("Authorization", authorization)
            .send({});

        expect(response.status).toBe(409);
        expect(response.body.error.code).toBe(
            "INVALID_STATUS_TRANSITION"
        );
    });
});
