import {
    InvoiceStatus,
    PaymentStatus,
    Prisma,
    Role,
    ScheduleStatus,
    UserStatus
} from "@prisma/client";
import request from "supertest";
import {
    beforeEach,
    describe,
    expect,
    it
} from "vitest";
import invoiceRouter from "../src/routes/invoice.routes.js";
import notificationRouter from "../src/routes/notification.routes.js";
import scheduleRouter from "../src/routes/schedule.route.js";
import utilityReadingRouter from "../src/routes/utility-reading.routes.js";
import { createBearerToken } from "./helpers/auth.js";
import { createTestApp } from "./helpers/test-app.js";
import {
    prismaMock,
    sendMailMock
} from "./setup.js";

const MANAGER_USER_ID = 101;
const ADMIN_USER_ID = 102;
const STAFF_USER_ID = 103;
const TENANT_USER_ID = 104;
const MANAGER_STAFF_ID = 201;
const STAFF_ID = 202;
const TENANT_ID = 203;
const BUILDING_ID = 301;
const OTHER_BUILDING_ID = 302;
const APARTMENT_ID = 401;

const assignmentWhere = {
    assigned_staff: {
        some: {
            id: MANAGER_STAFF_ID,
            user_id: MANAGER_USER_ID,
            user: {
                is: {
                    id: MANAGER_USER_ID,
                    role: Role.MANAGER,
                    status: UserStatus.ACTIVE
                }
            }
        }
    }
};

const managerApartmentScope = {
    building_id: BUILDING_ID,
    building: assignmentWhere
};

const staffAssignmentWhere = {
    assigned_staff: {
        some: {
            id: STAFF_ID,
            user_id: STAFF_USER_ID,
            user: {
                is: {
                    id: STAFF_USER_ID,
                    role: Role.STAFF,
                    status: UserStatus.ACTIVE
                }
            }
        }
    }
};

const staffApartmentScope = {
    building_id: BUILDING_ID,
    building: staffAssignmentWhere
};

const managerNotificationUserScope = {
    role: {
        not: Role.ADMIN
    },
    OR: [
        {
            staff: {
                building_id: BUILDING_ID,
                building: assignmentWhere
            }
        },
        {
            tenant: {
                OR: [
                    {
                        onboarding_building_id: BUILDING_ID,
                        onboarding_building: assignmentWhere
                    },
                    {
                        contracts: {
                            some: {
                                apartment: managerApartmentScope
                            }
                        }
                    }
                ]
            }
        }
    ]
};

const prismaNotFoundError = () =>
    new Prisma.PrismaClientKnownRequestError(
        "Scoped record disappeared",
        {
            code: "P2025",
            clientVersion: "6.15.0"
        }
    );

const prismaSerializationError = () =>
    new Prisma.PrismaClientKnownRequestError(
        "Transaction write conflict",
        {
            code: "P2034",
            clientVersion: "6.15.0"
        }
    );

const prismaUniqueError = () =>
    new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed",
        {
            code: "P2002",
            clientVersion: "6.15.0",
            meta: {
                target:
                    "viewing_schedules_one_active_slot_key"
            }
        }
    );

const utilityReadingRecord = {
    id: 501,
    apartment_id: APARTMENT_ID,
    month: 6,
    year: 2030,
    electric_old: 10,
    electric_new: 20,
    water_old: 5,
    water_new: 8,
    recorded_by: MANAGER_STAFF_ID,
    created_at: new Date("2030-06-01T00:00:00.000Z"),
    apartment: {
        id: APARTMENT_ID,
        building_id: BUILDING_ID,
        floor: 1,
        room_number: "A101",
        building: {
            id: BUILDING_ID,
            branch_name: "Central",
            address_new: "New"
        }
    },
    staff: {
        id: MANAGER_STAFF_ID,
        full_name: "Manager",
        phone: "0901234567",
        position: "Manager",
        building_id: BUILDING_ID
    }
};

const invoiceRecord = {
    id: 601,
    contract_id: 701,
    tenant_id: TENANT_ID,
    invoice_code: "INV-701-203006",
    due_date: new Date("2030-07-10T00:00:00.000Z"),
    total_amount: 8_000_000,
    status: InvoiceStatus.UNPAID,
    created_at: new Date("2030-07-01T00:00:00.000Z"),
    paid_at: null,
    contract: {
        id: 701,
        apartment_id: APARTMENT_ID,
        tenant_id: TENANT_ID,
        start_date: new Date("2030-01-01T00:00:00.000Z"),
        end_date: new Date("2031-01-01T00:00:00.000Z"),
        deposit_amount: 10_000_000,
        monthly_rent: 8_000_000,
        status: "ACTIVE",
        contract_file: null,
        signed_at: new Date("2029-12-20T00:00:00.000Z"),
        created_at: new Date("2029-12-20T00:00:00.000Z"),
        extended_at: null,
        tenant: {
            id: TENANT_ID,
            full_name: "Nguyen Van An",
            phone: "0901234567",
            email: "an@example.com",
            user_id: TENANT_USER_ID,
            user: {
                id: TENANT_USER_ID,
                username: "tenant",
                role: Role.TENANT
            }
        },
        apartment: {
            id: APARTMENT_ID,
            building_id: BUILDING_ID,
            floor: 1,
            room_number: "A101",
            area: 55,
            rental_price: 8_000_000,
            building: {
                id: BUILDING_ID,
                branch_name: "Central",
                address_new: "New"
            }
        }
    },
    items: [],
    payments: [{
        id: 801,
        invoice_id: 601,
        payment_method: "BANK",
        transaction_code: "TX-1",
        amount: 1_000_000,
        status: PaymentStatus.SUCCESS,
        paid_at: new Date("2030-07-02T00:00:00.000Z")
    }]
};

const scheduleRecord = {
    id: 501,
    apartment_id: APARTMENT_ID,
    guest_name: "Nguyen Van An",
    guest_phone: "0901234567",
    guest_email: "an@example.com",
    schedule_time: new Date("2030-01-02T09:00:00+07:00"),
    status: ScheduleStatus.PENDING,
    created_at: new Date("2029-12-01T00:00:00.000Z"),
    temp_locked_until: new Date("2030-01-01T00:10:00.000Z"),
    apartment: {
        id: APARTMENT_ID,
        building_id: BUILDING_ID,
        description: null,
        area: 55,
        bedrooms: 2,
        bathrooms: 1,
        rental_price: 8_000_000,
        status: "AVAILABLE",
        floor: 1,
        room_number: "A101",
        building: {
            id: BUILDING_ID,
            branch_name: "Central",
            address_old: "Old",
            address_new: "New",
            description: null,
            status: "ACTIVE",
            total_floors: 10,
            total_apartments: 20,
            thumbnail_url: null,
            created_at: new Date("2026-01-01T00:00:00.000Z")
        }
    }
};

const authenticationRecord = (
    role: Role,
    buildingId: number | null = role === Role.MANAGER
        || role === Role.STAFF
        ? BUILDING_ID
        : null
) => ({
    id: role === Role.ADMIN
        ? ADMIN_USER_ID
        : role === Role.STAFF
            ? STAFF_USER_ID
            : role === Role.TENANT
                ? TENANT_USER_ID
                : MANAGER_USER_ID,
    role,
    status: UserStatus.ACTIVE,
    staff: role === Role.MANAGER
        ? {
            id: MANAGER_STAFF_ID,
            building_id: buildingId
        }
        : role === Role.STAFF
            ? {
                id: STAFF_ID,
                building_id: buildingId
            }
            : null,
    tenant: role === Role.TENANT
        ? { id: TENANT_ID }
        : null
});

const authenticateAs = (
    role: Role,
    buildingId?: number | null
) => {
    prismaMock.user.findUnique.mockResolvedValueOnce(
        authenticationRecord(
            role,
            buildingId === undefined
                ? role === Role.MANAGER || role === Role.STAFF
                    ? BUILDING_ID
                    : null
                : buildingId
        ) as never
    );
};

const userIdFor = (role: Role) => role === Role.ADMIN
    ? ADMIN_USER_ID
    : role === Role.STAFF
        ? STAFF_USER_ID
        : role === Role.TENANT
            ? TENANT_USER_ID
            : MANAGER_USER_ID;

const authorizationFor = (role: Role) =>
    createBearerToken(userIdFor(role));

const utilityApp = () =>
    createTestApp(utilityReadingRouter, "/utility-readings");
const invoiceApp = () =>
    createTestApp(invoiceRouter, "/invoices");
const notificationApp = () =>
    createTestApp(notificationRouter, "/notifications");
const scheduleApp = () =>
    createTestApp(scheduleRouter, "/schedules");

beforeEach(() => {
    process.env.SMTP_HOST = "smtp.test";
    process.env.SMTP_USER = "test-user";
    process.env.SMTP_PASS = "test-pass";
    process.env.SMTP_FROM = "noreply@example.com";
    prismaMock.$transaction.mockImplementation(
        async (operation: unknown) => {
            if (typeof operation === "function") {
                return (
                    operation as (
                        client: typeof prismaMock
                    ) => Promise<unknown>
                )(prismaMock);
            }

            return Promise.all(operation as Promise<unknown>[]);
        }
    );
});

describe("viewing schedule public and management boundaries", () => {
    it.each([
        ["timezone-less", "2030-01-02T09:00:00"],
        ["partial hour", "2030-01-02T09:30:00+07:00"],
        ["nonzero seconds", "2030-01-02T09:00:30+07:00"],
        ["nonzero milliseconds", "2030-01-02T09:00:00.001+07:00"]
    ])(
        "rejects a %s public viewing timestamp",
        async (_label, scheduleTime) => {
            const response = await request(scheduleApp())
                .post("/schedules/book")
                .send({
                    apartment_id: APARTMENT_ID,
                    guest_name: "Nguyen Van An",
                    guest_phone: "0901234567",
                    guest_email: "an@example.com",
                    schedule_time: scheduleTime
                });

            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe("VALIDATION_ERROR");
            expect(prismaMock.apartment.findUnique)
                .not.toHaveBeenCalled();
        }
    );

    it.each([
        "2030-02-30",
        "2030-01-02T00:00:00Z"
    ])("rejects invalid date-only availability input %s", async (date) => {
        prismaMock.viewingSchedule.findMany.mockResolvedValueOnce([]);

        const response = await request(scheduleApp())
            .get(
                "/schedules/availability"
                + `?apartment_id=${APARTMENT_ID}&date=${date}`
            );

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe("VALIDATION_ERROR");
        expect(prismaMock.viewingSchedule.findMany)
            .not.toHaveBeenCalled();
    });

    it("uses Vietnam whole-hour slots and day bounds even when the process timezone is UTC", async () => {
        const previousTimezone = process.env.TZ;
        process.env.TZ = "UTC";

        try {
            prismaMock.apartment.findUnique.mockResolvedValueOnce({
                id: APARTMENT_ID,
                room_number: "A101",
                floor: 1,
                building: {
                    branch_name: "Central",
                    address_old: "Old",
                    address_new: "New"
                }
            } as never);
            prismaMock.viewingSchedule.findFirst
                .mockResolvedValueOnce(null);
            prismaMock.viewingSchedule.create.mockResolvedValueOnce({
                id: 501,
                apartment_id: APARTMENT_ID,
                guest_name: "Nguyen Van An",
                guest_phone: "0901234567",
                guest_email: "an@example.com",
                schedule_time: new Date("2030-01-02T02:00:00Z"),
                status: ScheduleStatus.PENDING
            } as never);
            sendMailMock.mockResolvedValueOnce({} as never);

            const booked = await request(scheduleApp())
                .post("/schedules/book")
                .send({
                    apartment_id: APARTMENT_ID,
                    guest_name: "Nguyen Van An",
                    guest_phone: "0901234567",
                    guest_email: "an@example.com",
                    schedule_time: "2030-01-02T02:00:00Z"
                });

            expect(booked.status).toBe(201);

            prismaMock.viewingSchedule.findMany
                .mockResolvedValueOnce([]);
            const availability = await request(scheduleApp())
                .get(
                    "/schedules/availability"
                    + `?apartment_id=${APARTMENT_ID}`
                    + "&date=2030-01-02"
                );

            expect(availability.status).toBe(200);
            expect(prismaMock.viewingSchedule.findMany)
                .toHaveBeenCalledWith(
                    expect.objectContaining({
                        where: expect.objectContaining({
                            schedule_time: {
                                gte: new Date(
                                    "2030-01-01T17:00:00.000Z"
                                ),
                                lt: new Date(
                                    "2030-01-02T17:00:00.000Z"
                                )
                            }
                        })
                    })
                );
        } finally {
            if (previousTimezone === undefined) {
                delete process.env.TZ;
            } else {
                process.env.TZ = previousTimezone;
            }
        }
    });

    it("keeps public booking unauthenticated and rejects unknown input through strict Zod", async () => {
        const response = await request(scheduleApp())
            .post("/schedules/book")
            .send({
                apartment_id: APARTMENT_ID,
                guest_name: "Nguyen Van An",
                guest_phone: "0901234567",
                guest_email: "an@example.com",
                schedule_time: "2030-01-02T09:00:00+07:00",
                privileged: true
            });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe("VALIDATION_ERROR");
        expect(prismaMock.apartment.findUnique).not.toHaveBeenCalled();
    });

    it("books a public schedule with the standard success envelope", async () => {
        prismaMock.apartment.findUnique.mockResolvedValueOnce({
            id: APARTMENT_ID,
            room_number: "A101",
            floor: 1,
            building: {
                branch_name: "Central",
                address_old: "Old",
                address_new: "New"
            }
        } as never);
        prismaMock.viewingSchedule.findFirst.mockResolvedValueOnce(null);
        prismaMock.viewingSchedule.create.mockResolvedValueOnce({
            id: 501,
            apartment_id: APARTMENT_ID,
            guest_name: "Nguyen Van An",
            guest_phone: "0901234567",
            guest_email: "an@example.com",
            schedule_time: new Date("2030-01-02T09:00:00+07:00"),
            status: ScheduleStatus.PENDING
        } as never);
        sendMailMock.mockResolvedValueOnce({} as never);

        const response = await request(scheduleApp())
            .post("/schedules/book")
            .send({
                apartment_id: APARTMENT_ID,
                guest_name: "Nguyen Van An",
                guest_phone: "0901234567",
                guest_email: "an@example.com",
                schedule_time: "2030-01-02T09:00:00+07:00"
            });

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
            success: true,
            data: {
                id: 501,
                apartment_id: APARTMENT_ID
            }
        });
    });

    it("cancels an expired exact-slot lock inside the booking transaction before create", async () => {
        const requestedDate = new Date(
            "2030-01-02T09:00:00+07:00"
        );
        prismaMock.apartment.findUnique.mockResolvedValueOnce({
            id: APARTMENT_ID,
            room_number: "A101",
            floor: 1,
            building: {
                branch_name: "Central",
                address_old: "Old",
                address_new: "New"
            }
        } as never);
        prismaMock.viewingSchedule.updateMany.mockResolvedValueOnce({
            count: 1
        });
        prismaMock.viewingSchedule.findFirst.mockResolvedValueOnce(null);
        prismaMock.viewingSchedule.create.mockResolvedValueOnce({
            id: 501,
            apartment_id: APARTMENT_ID,
            guest_name: "Nguyen Van An",
            guest_phone: "0901234567",
            guest_email: "an@example.com",
            schedule_time: requestedDate,
            status: ScheduleStatus.PENDING
        } as never);
        sendMailMock.mockResolvedValueOnce({} as never);

        const response = await request(scheduleApp())
            .post("/schedules/book")
            .send({
                apartment_id: APARTMENT_ID,
                guest_name: "Nguyen Van An",
                guest_phone: "0901234567",
                guest_email: "an@example.com",
                schedule_time: "2030-01-02T09:00:00+07:00"
            });

        expect(response.status).toBe(201);
        expect(prismaMock.$transaction).toHaveBeenCalledWith(
            expect.any(Function),
            {
                isolationLevel:
                    Prisma.TransactionIsolationLevel.Serializable
            }
        );
        expect(prismaMock.viewingSchedule.updateMany)
            .toHaveBeenCalledWith({
                where: {
                    apartment_id: APARTMENT_ID,
                    schedule_time: requestedDate,
                    status: ScheduleStatus.PENDING,
                    OR: [
                        { temp_locked_until: null },
                        {
                            temp_locked_until: {
                                lte: expect.any(Date)
                            }
                        }
                    ]
                },
                data: {
                    status: ScheduleStatus.CANCELLED,
                    temp_locked_until: null
                }
            });
        expect(
            prismaMock.viewingSchedule.updateMany
                .mock.invocationCallOrder[0]
        ).toBeLessThan(
            prismaMock.viewingSchedule.create
                .mock.invocationCallOrder[0]
        );
    });

    it("treats a NULL PENDING lock as stale before booking the exact slot", async () => {
        const requestedDate = new Date(
            "2030-01-02T09:00:00+07:00"
        );
        prismaMock.apartment.findUnique.mockResolvedValueOnce({
            id: APARTMENT_ID,
            room_number: "A101",
            floor: 1,
            building: {
                branch_name: "Central",
                address_old: "Old",
                address_new: "New"
            }
        } as never);
        prismaMock.viewingSchedule.updateMany.mockResolvedValueOnce({
            count: 1
        });
        prismaMock.viewingSchedule.findFirst.mockResolvedValueOnce(null);
        prismaMock.viewingSchedule.create.mockResolvedValueOnce({
            id: 501,
            apartment_id: APARTMENT_ID,
            guest_name: "Nguyen Van An",
            guest_phone: "0901234567",
            guest_email: "an@example.com",
            schedule_time: requestedDate,
            status: ScheduleStatus.PENDING
        } as never);
        sendMailMock.mockResolvedValueOnce({} as never);

        const response = await request(scheduleApp())
            .post("/schedules/book")
            .send({
                apartment_id: APARTMENT_ID,
                guest_name: "Nguyen Van An",
                guest_phone: "0901234567",
                guest_email: "an@example.com",
                schedule_time: "2030-01-02T09:00:00+07:00"
            });

        expect(response.status).toBe(201);
        expect(prismaMock.viewingSchedule.updateMany)
            .toHaveBeenCalledWith({
                where: {
                    apartment_id: APARTMENT_ID,
                    schedule_time: requestedDate,
                    status: ScheduleStatus.PENDING,
                    OR: [
                        { temp_locked_until: null },
                        {
                            temp_locked_until: {
                                lte: expect.any(Date)
                            }
                        }
                    ]
                },
                data: {
                    status: ScheduleStatus.CANCELLED,
                    temp_locked_until: null
                }
            });
    });

    it("maps a concurrent active-slot unique conflict to SLOT_UNAVAILABLE", async () => {
        prismaMock.apartment.findUnique.mockResolvedValueOnce({
            id: APARTMENT_ID,
            room_number: "A101",
            floor: 1,
            building: {
                branch_name: "Central",
                address_old: "Old",
                address_new: "New"
            }
        } as never);
        prismaMock.viewingSchedule.updateMany.mockResolvedValueOnce({
            count: 0
        });
        prismaMock.viewingSchedule.findFirst.mockResolvedValueOnce(null);
        prismaMock.viewingSchedule.create.mockRejectedValueOnce(
            prismaUniqueError()
        );

        const response = await request(scheduleApp())
            .post("/schedules/book")
            .send({
                apartment_id: APARTMENT_ID,
                guest_name: "Nguyen Van An",
                guest_phone: "0901234567",
                guest_email: "an@example.com",
                schedule_time: "2030-01-02T09:00:00+07:00"
            });

        expect(response.status).toBe(409);
        expect(response.body).toEqual({
            success: false,
            error: {
                code: "SLOT_UNAVAILABLE",
                message: "This viewing time is unavailable"
            }
        });
    });

    it("maps exhausted booking serialization retries to standard 409", async () => {
        prismaMock.apartment.findUnique.mockResolvedValueOnce({
            id: APARTMENT_ID,
            room_number: "A101",
            floor: 1,
            building: {
                branch_name: "Central",
                address_old: "Old",
                address_new: "New"
            }
        } as never);
        prismaMock.$transaction
            .mockRejectedValueOnce(prismaSerializationError())
            .mockRejectedValueOnce(prismaSerializationError())
            .mockRejectedValueOnce(prismaSerializationError());
        prismaMock.viewingSchedule.findFirst.mockResolvedValueOnce(null);
        prismaMock.viewingSchedule.create.mockResolvedValueOnce({
            id: 501
        } as never);
        sendMailMock.mockResolvedValueOnce({} as never);

        const response = await request(scheduleApp())
            .post("/schedules/book")
            .send({
                apartment_id: APARTMENT_ID,
                guest_name: "Nguyen Van An",
                guest_phone: "0901234567",
                guest_email: "an@example.com",
                schedule_time: "2030-01-02T09:00:00+07:00"
            });

        expect(response.status).toBe(409);
        expect(response.body).toEqual({
            success: false,
            error: {
                code: "CONCURRENT_MODIFICATION",
                message:
                    "Viewing schedule changed during this operation"
            }
        });
        expect(prismaMock.$transaction).toHaveBeenCalledTimes(3);
    });

    it("does not delete a booking that was concurrently confirmed when email fails", async () => {
        const tempLockedUntil =
            new Date("2030-01-02T02:10:00.000Z");
        prismaMock.apartment.findUnique.mockResolvedValueOnce({
            id: APARTMENT_ID,
            room_number: "A101",
            floor: 1,
            building: {
                branch_name: "Central",
                address_old: "Old",
                address_new: "New"
            }
        } as never);
        prismaMock.viewingSchedule.updateMany.mockResolvedValueOnce({
            count: 0
        });
        prismaMock.viewingSchedule.findFirst.mockResolvedValueOnce(null);
        prismaMock.viewingSchedule.create.mockResolvedValueOnce({
            id: 501,
            apartment_id: APARTMENT_ID,
            guest_name: "Nguyen Van An",
            guest_phone: "0901234567",
            guest_email: "an@example.com",
            schedule_time:
                new Date("2030-01-02T02:00:00.000Z"),
            status: ScheduleStatus.PENDING,
            temp_locked_until: tempLockedUntil
        } as never);
        prismaMock.viewingSchedule.deleteMany.mockResolvedValueOnce({
            count: 0
        });
        sendMailMock.mockRejectedValueOnce(new Error("SMTP down"));

        const response = await request(scheduleApp())
            .post("/schedules/book")
            .send({
                apartment_id: APARTMENT_ID,
                guest_name: "Nguyen Van An",
                guest_phone: "0901234567",
                guest_email: "an@example.com",
                schedule_time: "2030-01-02T09:00:00+07:00"
            });

        expect(response.status).toBe(503);
        expect(prismaMock.viewingSchedule.deleteMany)
            .toHaveBeenCalledWith({
                where: {
                    id: 501,
                    status: ScheduleStatus.PENDING,
                    temp_locked_until: tempLockedUntil
                }
            });
        expect(prismaMock.viewingSchedule.delete)
            .not.toHaveBeenCalled();
    });

    it("rejects anonymous schedule management before Prisma access", async () => {
        const responses = await Promise.all([
            request(scheduleApp()).get("/schedules"),
            request(scheduleApp()).put("/schedules/501/confirm").send({}),
            request(scheduleApp()).put("/schedules/501/cancel").send({}),
            request(scheduleApp()).delete("/schedules/501")
        ]);

        for (const response of responses) {
            expect(response.status).toBe(401);
            expect(response.body.error.code).toBe(
                "AUTHENTICATION_REQUIRED"
            );
        }

        expect(prismaMock.viewingSchedule.findMany).not.toHaveBeenCalled();
        expect(prismaMock.viewingSchedule.update).not.toHaveBeenCalled();
        expect(prismaMock.viewingSchedule.deleteMany).not.toHaveBeenCalled();
    });

    it("overrides a Manager building filter with the current live assignment", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.viewingSchedule.findMany.mockResolvedValueOnce([]);
        prismaMock.viewingSchedule.count.mockResolvedValueOnce(0);

        const response = await request(scheduleApp())
            .get(`/schedules?building_id=${OTHER_BUILDING_ID}&page=2&limit=5`)
            .set("Authorization", authorizationFor(Role.MANAGER));

        expect(response.status).toBe(200);
        expect(prismaMock.viewingSchedule.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    apartment: managerApartmentScope
                },
                skip: 5,
                take: 5
            })
        );
        expect(prismaMock.staff.findUnique).not.toHaveBeenCalled();
        expect(response.body.meta.pagination).toEqual({
            total: 0,
            page: 2,
            limit: 5,
            totalPages: 0
        });
    });

    it("returns 404 for Manager confirm outside scope and on a final P2025 race", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.viewingSchedule.findFirst.mockResolvedValueOnce(null);

        const outside = await request(scheduleApp())
            .put("/schedules/501/confirm")
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send({});

        expect(outside.status).toBe(404);
        expect(prismaMock.viewingSchedule.findFirst)
            .toHaveBeenCalledWith({
                where: {
                    id: 501,
                    apartment: managerApartmentScope
                },
                include: expect.any(Object)
            });

        authenticateAs(Role.MANAGER);
        prismaMock.viewingSchedule.findFirst
            .mockResolvedValueOnce(scheduleRecord as never)
            .mockResolvedValueOnce(null);
        prismaMock.viewingSchedule.update.mockRejectedValueOnce(
            prismaNotFoundError()
        );

        const raced = await request(scheduleApp())
            .put("/schedules/501/confirm")
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send({});

        expect(raced.status).toBe(404);
        expect(prismaMock.viewingSchedule.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    id: 501,
                    status: ScheduleStatus.PENDING,
                    apartment: managerApartmentScope
                }
            })
        );
    });

    it("maps a confirmation slot conflict while retaining the final Manager CAS scope", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.viewingSchedule.findFirst
            .mockResolvedValueOnce(scheduleRecord as never)
            .mockResolvedValueOnce(null);
        prismaMock.viewingSchedule.update.mockRejectedValueOnce(
            prismaUniqueError()
        );

        const response = await request(scheduleApp())
            .put("/schedules/501/confirm")
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send({});

        expect(response.status).toBe(409);
        expect(response.body).toEqual({
            success: false,
            error: {
                code: "SLOT_UNAVAILABLE",
                message: "This viewing time is unavailable"
            }
        });
        expect(prismaMock.viewingSchedule.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    id: 501,
                    status: ScheduleStatus.PENDING,
                    apartment: managerApartmentScope
                }
            })
        );
    });

    it("guards Manager cancel and delete with the apartment assignment", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.viewingSchedule.findFirst.mockResolvedValueOnce(null);

        const cancelled = await request(scheduleApp())
            .put("/schedules/501/cancel")
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send({});

        expect(cancelled.status).toBe(404);

        authenticateAs(Role.MANAGER);
        prismaMock.viewingSchedule.deleteMany.mockResolvedValueOnce({
            count: 0
        });

        const deleted = await request(scheduleApp())
            .delete("/schedules/501")
            .set("Authorization", authorizationFor(Role.MANAGER));

        expect(deleted.status).toBe(404);
        expect(prismaMock.viewingSchedule.deleteMany)
            .toHaveBeenCalledWith({
                where: {
                    id: 501,
                    apartment: managerApartmentScope
                }
            });
    });
});

describe("utility-reading actor and building scope", () => {
    it.each([Role.MANAGER, Role.STAFF])(
        "requires the %s actor to have a building assignment",
        async (role) => {
            authenticateAs(role, null);

            const response = await request(utilityApp())
                .get("/utility-readings")
                .set("Authorization", authorizationFor(role));

            expect(response.status).toBe(403);
            expect(prismaMock.utilityReading.findMany)
                .not.toHaveBeenCalled();
            expect(prismaMock.staff.findUnique).not.toHaveBeenCalled();
        }
    );

    it("overrides Manager building input with a live relation scope", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.utilityReading.findMany.mockResolvedValueOnce([]);
        prismaMock.utilityReading.count.mockResolvedValueOnce(0);

        const response = await request(utilityApp())
            .get(
                `/utility-readings?building_id=${OTHER_BUILDING_ID}`
                + "&page=1&limit=10"
            )
            .set("Authorization", authorizationFor(Role.MANAGER));

        expect(response.status).toBe(200);
        expect(prismaMock.utilityReading.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    apartment: managerApartmentScope
                }
            })
        );
        expect(prismaMock.staff.findUnique).not.toHaveBeenCalled();
    });

    it("forces Staff utility lists to the actor recorder despite client filters", async () => {
        authenticateAs(Role.STAFF);
        prismaMock.utilityReading.findMany.mockResolvedValueOnce([]);
        prismaMock.utilityReading.count.mockResolvedValueOnce(0);

        const response = await request(utilityApp())
            .get(
                `/utility-readings?recorded_by=${MANAGER_STAFF_ID}`
                + `&building_id=${OTHER_BUILDING_ID}`
            )
            .set("Authorization", authorizationFor(Role.STAFF));

        expect(response.status).toBe(200);
        expect(prismaMock.utilityReading.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    recorded_by: STAFF_ID,
                    apartment: staffApartmentScope
                }
            })
        );
    });

    it("hides another recorder's utility reading from Staff detail", async () => {
        authenticateAs(Role.STAFF);
        prismaMock.utilityReading.findFirst.mockResolvedValueOnce(null);

        const response = await request(utilityApp())
            .get("/utility-readings/501")
            .set("Authorization", authorizationFor(Role.STAFF));

        expect(response.status).toBe(404);
        expect(prismaMock.utilityReading.findFirst).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    id: 501,
                    recorded_by: STAFF_ID,
                    apartment: staffApartmentScope
                }
            })
        );
    });

    it("keeps Staff recorder ownership in the final utility update", async () => {
        authenticateAs(Role.STAFF);
        prismaMock.utilityReading.findFirst.mockResolvedValueOnce({
            ...utilityReadingRecord,
            recorded_by: STAFF_ID
        } as never);
        prismaMock.apartment.findFirst.mockResolvedValueOnce({
            id: APARTMENT_ID
        } as never);
        prismaMock.utilityReading.update.mockRejectedValueOnce(
            prismaNotFoundError()
        );

        const response = await request(utilityApp())
            .put("/utility-readings/501")
            .set("Authorization", authorizationFor(Role.STAFF))
            .send({ electric_new: 30 });

        expect(response.status).toBe(404);
        expect(prismaMock.utilityReading.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    id: 501,
                    recorded_by: STAFF_ID,
                    apartment: staffApartmentScope
                }
            })
        );
    });

    it("keeps Staff recorder ownership in the final utility delete", async () => {
        authenticateAs(Role.STAFF);
        prismaMock.utilityReading.deleteMany.mockResolvedValueOnce({
            count: 0
        });

        const response = await request(utilityApp())
            .delete("/utility-readings/501")
            .set("Authorization", authorizationFor(Role.STAFF));

        expect(response.status).toBe(404);
        expect(prismaMock.utilityReading.deleteMany).toHaveBeenCalledWith({
            where: {
                id: 501,
                recorded_by: STAFF_ID,
                apartment: staffApartmentScope
            }
        });
    });

    it("rejects client-controlled recorded_by fields before create", async () => {
        authenticateAs(Role.STAFF);

        const response = await request(utilityApp())
            .post("/utility-readings")
            .set("Authorization", authorizationFor(Role.STAFF))
            .send({
                apartment_id: APARTMENT_ID,
                month: 6,
                year: 2030,
                electric_old: 10,
                electric_new: 20,
                water_old: 5,
                water_new: 8,
                recorded_by: 999
            });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe("VALIDATION_ERROR");
        expect(prismaMock.utilityReading.create).not.toHaveBeenCalled();
    });

    it("creates a Manager utility reading through live apartment and staff connects", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.apartment.findFirst.mockResolvedValueOnce({
            id: APARTMENT_ID,
            building_id: BUILDING_ID
        } as never);
        prismaMock.utilityReading.findFirst.mockResolvedValueOnce(null);
        prismaMock.utilityReading.create.mockResolvedValueOnce(
            utilityReadingRecord as never
        );

        const response = await request(utilityApp())
            .post("/utility-readings")
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send({
                apartment_id: APARTMENT_ID,
                month: 6,
                year: 2030,
                electric_old: 10,
                electric_new: 20,
                water_old: 5,
                water_new: 8
            });

        expect(response.status).toBe(201);
        expect(prismaMock.utilityReading.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    apartment: {
                        connect: {
                            id: APARTMENT_ID,
                            ...managerApartmentScope
                        }
                    },
                    staff: {
                        connect: {
                            id: MANAGER_STAFF_ID,
                            user_id: MANAGER_USER_ID,
                            building_id: BUILDING_ID,
                            building: assignmentWhere
                        }
                    }
                })
            })
        );
    });

    it("returns 404 before a Manager utility update can cross scope", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.utilityReading.findFirst.mockResolvedValueOnce(null);

        const response = await request(utilityApp())
            .put("/utility-readings/501")
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send({ electric_new: 30 });

        expect(response.status).toBe(404);
        expect(prismaMock.utilityReading.update).not.toHaveBeenCalled();
        expect(prismaMock.utilityReading.findFirst).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    id: 501,
                    apartment: managerApartmentScope
                }
            })
        );
    });

    it("preserves recorded_by when an Admin updates only meter values", async () => {
        authenticateAs(Role.ADMIN);
        prismaMock.utilityReading.findUnique.mockResolvedValueOnce(
            utilityReadingRecord as never
        );
        prismaMock.apartment.findFirst.mockResolvedValueOnce({
            id: APARTMENT_ID
        } as never);
        prismaMock.utilityReading.update.mockResolvedValueOnce({
            ...utilityReadingRecord,
            electric_new: 30
        } as never);

        const response = await request(utilityApp())
            .put("/utility-readings/501")
            .set("Authorization", authorizationFor(Role.ADMIN))
            .send({ electric_new: 30 });

        expect(response.status).toBe(200);
        expect(prismaMock.utilityReading.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 501 },
                data: expect.objectContaining({
                    recorded_by: MANAGER_STAFF_ID,
                    electric_new: 30
                })
            })
        );
    });

    it("returns 404 when a scoped utility delete loses the assignment race", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.utilityReading.deleteMany.mockResolvedValueOnce({
            count: 0
        });

        const response = await request(utilityApp())
            .delete("/utility-readings/501")
            .set("Authorization", authorizationFor(Role.MANAGER));

        expect(response.status).toBe(404);
        expect(prismaMock.utilityReading.deleteMany).toHaveBeenCalledWith({
            where: {
                id: 501,
                apartment: managerApartmentScope
            }
        });
    });

    it("keeps Admin utility listing global", async () => {
        authenticateAs(Role.ADMIN);
        prismaMock.utilityReading.findMany.mockResolvedValueOnce([]);
        prismaMock.utilityReading.count.mockResolvedValueOnce(0);

        const response = await request(utilityApp())
            .get("/utility-readings?page=1&limit=10")
            .set("Authorization", authorizationFor(Role.ADMIN));

        expect(response.status).toBe(200);
        expect(prismaMock.utilityReading.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: {} })
        );
    });
});

describe("invoice Manager and Tenant scope", () => {
    it.each([
        null,
        true,
        1_893_456_000_000,
        "2030-07-10T00:00:00"
    ])("rejects non-RFC3339 invoice due_date input %j", async (dueDate) => {
        authenticateAs(Role.MANAGER);

        const response = await request(invoiceApp())
            .post("/invoices/generate-monthly")
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send({
                month: 6,
                year: 2030,
                due_date: dueDate,
                notify: false
            });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe("VALIDATION_ERROR");
        expect(prismaMock.rentalContract.findMany)
            .not.toHaveBeenCalled();
    });

    it("uses actor fields without re-querying Manager or Tenant profiles", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.invoice.findMany.mockResolvedValueOnce([]);
        prismaMock.invoice.count.mockResolvedValueOnce(0);

        const managerResponse = await request(invoiceApp())
            .get(`/invoices?building_id=${OTHER_BUILDING_ID}`)
            .set("Authorization", authorizationFor(Role.MANAGER));

        expect(managerResponse.status).toBe(200);
        expect(prismaMock.invoice.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    AND: [
                        {
                            contract: {
                                apartment: managerApartmentScope
                            }
                        }
                    ]
                }
            })
        );
        expect(prismaMock.staff.findUnique).not.toHaveBeenCalled();

        authenticateAs(Role.TENANT);
        prismaMock.invoice.findMany.mockResolvedValueOnce([]);
        prismaMock.invoice.count.mockResolvedValueOnce(0);

        const tenantResponse = await request(invoiceApp())
            .get(`/invoices?tenant_id=${TENANT_ID + 1}`)
            .set("Authorization", authorizationFor(Role.TENANT));

        expect(tenantResponse.status).toBe(200);
        expect(prismaMock.invoice.findMany).toHaveBeenLastCalledWith(
            expect.objectContaining({
                where: {
                    AND: [
                        { tenant_id: TENANT_ID }
                    ]
                }
            })
        );
        expect(prismaMock.tenant.findUnique).not.toHaveBeenCalled();
    });

    it("keeps Admin invoice listing global", async () => {
        authenticateAs(Role.ADMIN);
        prismaMock.invoice.findMany.mockResolvedValueOnce([]);
        prismaMock.invoice.count.mockResolvedValueOnce(0);

        const response = await request(invoiceApp())
            .get("/invoices")
            .set("Authorization", authorizationFor(Role.ADMIN));

        expect(response.status).toBe(200);
        expect(prismaMock.invoice.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: {} })
        );
    });

    it("returns 404 for an out-of-scope Manager invoice detail", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.invoice.findFirst.mockResolvedValueOnce(null);

        const response = await request(invoiceApp())
            .get("/invoices/501")
            .set("Authorization", authorizationFor(Role.MANAGER));

        expect(response.status).toBe(404);
        expect(prismaMock.invoice.findFirst).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    id: 501,
                    contract: {
                        apartment: managerApartmentScope
                    }
                }
            })
        );
    });

    it("generates Manager invoices only from contracts in the live assignment", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.rentalContract.findMany.mockResolvedValueOnce([]);

        const response = await request(invoiceApp())
            .post("/invoices/generate-monthly")
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send({
                month: 6,
                year: 2030,
                building_id: OTHER_BUILDING_ID,
                notify: false
            });

        expect(response.status).toBe(201);
        expect(prismaMock.rentalContract.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    apartment: managerApartmentScope
                })
            })
        );
    });

    it("lets a Tenant read only the invoice selected by actor.tenantId", async () => {
        authenticateAs(Role.TENANT);
        prismaMock.invoice.findFirst.mockResolvedValueOnce(
            invoiceRecord as never
        );

        const own = await request(invoiceApp())
            .get("/invoices/601")
            .set("Authorization", authorizationFor(Role.TENANT));

        expect(own.status).toBe(200);
        expect(prismaMock.invoice.findFirst).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    id: 601,
                    tenant_id: TENANT_ID
                }
            })
        );

        authenticateAs(Role.TENANT);
        prismaMock.invoice.findFirst.mockResolvedValueOnce(null);

        const outside = await request(invoiceApp())
            .get("/invoices/602")
            .set("Authorization", authorizationFor(Role.TENANT));

        expect(outside.status).toBe(404);
    });

    it("keeps the live Manager predicate in the status CAS and returns 404 on scope loss", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.invoice.findFirst
            .mockResolvedValueOnce(invoiceRecord as never)
            .mockResolvedValueOnce(null);
        prismaMock.invoice.updateMany.mockResolvedValueOnce({
            count: 0
        });

        const response = await request(invoiceApp())
            .patch("/invoices/601/status")
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send({ status: InvoiceStatus.PAID });

        expect(response.status).toBe(404);
        expect(prismaMock.invoice.updateMany).toHaveBeenCalledWith({
            where: {
                id: 601,
                status: InvoiceStatus.UNPAID,
                contract: {
                    apartment: managerApartmentScope
                }
            },
            data: {
                status: InvoiceStatus.PAID,
                paid_at: expect.any(Date)
            }
        });
        expect(prismaMock.notification.create).not.toHaveBeenCalled();
    });

    it("lets only the invoice status CAS winner create an INVOICE_PAID notification", async () => {
        const paidInvoice = {
            ...invoiceRecord,
            status: InvoiceStatus.PAID,
            paid_at: new Date("2030-07-02T00:00:00.000Z")
        };
        authenticateAs(Role.MANAGER);
        prismaMock.invoice.findFirst
            .mockResolvedValueOnce(invoiceRecord as never)
            .mockResolvedValueOnce(paidInvoice as never);
        prismaMock.invoice.update.mockResolvedValueOnce(
            paidInvoice as never
        );
        prismaMock.invoice.updateMany.mockResolvedValueOnce({
            count: 1
        });
        prismaMock.notification.create.mockResolvedValueOnce({} as never);

        const response = await request(invoiceApp())
            .patch("/invoices/601/status")
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send({ status: InvoiceStatus.PAID });

        expect(response.status).toBe(200);
        expect(prismaMock.invoice.updateMany).toHaveBeenCalledWith({
            where: {
                id: 601,
                status: InvoiceStatus.UNPAID,
                contract: {
                    apartment: managerApartmentScope
                }
            },
            data: {
                status: InvoiceStatus.PAID,
                paid_at: expect.any(Date)
            }
        });
        expect(prismaMock.notification.create).toHaveBeenCalledTimes(1);
        expect(
            prismaMock.$transaction.mock.invocationCallOrder[0]
        ).toBeLessThan(
            prismaMock.invoice.findFirst.mock.invocationCallOrder[0]
        );
    });

    it("returns the desired invoice status without a duplicate notification when the CAS loses", async () => {
        const paidInvoice = {
            ...invoiceRecord,
            status: InvoiceStatus.PAID,
            paid_at: new Date("2030-07-02T00:00:00.000Z")
        };
        authenticateAs(Role.MANAGER);
        prismaMock.invoice.findFirst
            .mockResolvedValueOnce(invoiceRecord as never)
            .mockResolvedValueOnce(paidInvoice as never);
        prismaMock.invoice.update.mockResolvedValueOnce(
            paidInvoice as never
        );
        prismaMock.invoice.updateMany.mockResolvedValueOnce({
            count: 0
        });
        prismaMock.notification.create.mockResolvedValueOnce({} as never);

        const response = await request(invoiceApp())
            .patch("/invoices/601/status")
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send({ status: InvoiceStatus.PAID });

        expect(response.status).toBe(200);
        expect(response.body.data.status).toBe(InvoiceStatus.PAID);
        expect(prismaMock.notification.create).not.toHaveBeenCalled();
    });

    it("treats an already desired invoice status as idempotent without a write", async () => {
        const paidInvoice = {
            ...invoiceRecord,
            status: InvoiceStatus.PAID,
            paid_at: new Date("2030-07-02T00:00:00.000Z")
        };
        authenticateAs(Role.MANAGER);
        prismaMock.invoice.findFirst.mockResolvedValueOnce(
            paidInvoice as never
        );
        prismaMock.invoice.update.mockResolvedValueOnce(
            paidInvoice as never
        );

        const response = await request(invoiceApp())
            .patch("/invoices/601/status")
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send({ status: InvoiceStatus.PAID });

        expect(response.status).toBe(200);
        expect(prismaMock.invoice.updateMany).not.toHaveBeenCalled();
        expect(prismaMock.invoice.update).not.toHaveBeenCalled();
        expect(prismaMock.notification.create).not.toHaveBeenCalled();
    });
});

describe("notification recipient scope", () => {
    it("lists only users linked to a Manager building by staff, onboarding, or contract", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.notification.findMany.mockResolvedValueOnce([]);
        prismaMock.notification.count
            .mockResolvedValueOnce(0)
            .mockResolvedValueOnce(0);

        const response = await request(notificationApp())
            .get(`/notifications?building_id=${OTHER_BUILDING_ID}`)
            .set("Authorization", authorizationFor(Role.MANAGER));

        expect(response.status).toBe(200);
        expect(prismaMock.notification.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    AND: [
                        {
                            user: managerNotificationUserScope
                        }
                    ]
                }
            })
        );
        expect(prismaMock.staff.findUnique).not.toHaveBeenCalled();
    });

    it("overrides Tenant user and tenant filters with actor identity", async () => {
        authenticateAs(Role.TENANT);
        prismaMock.notification.findMany.mockResolvedValueOnce([]);
        prismaMock.notification.count
            .mockResolvedValueOnce(0)
            .mockResolvedValueOnce(0);

        const response = await request(notificationApp())
            .get(
                `/notifications?user_id=${ADMIN_USER_ID}`
                + `&tenant_id=${TENANT_ID + 1}`
            )
            .set("Authorization", authorizationFor(Role.TENANT));

        expect(response.status).toBe(200);
        expect(prismaMock.notification.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    AND: [
                        { user_id: TENANT_USER_ID }
                    ]
                }
            })
        );
        expect(prismaMock.tenant.findUnique).not.toHaveBeenCalled();
    });

    it("marks a scoped notification read in one atomic update and maps P2025 to 404", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.notification.update.mockRejectedValueOnce(
            prismaNotFoundError()
        );

        const response = await request(notificationApp())
            .patch("/notifications/501/read")
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send({ is_read: true });

        expect(response.status).toBe(404);
        expect(prismaMock.notification.update).toHaveBeenCalledWith({
            where: {
                id: 501,
                AND: [{
                    user: managerNotificationUserScope
                }]
            },
            data: { is_read: true },
            include: expect.any(Object)
        });
        expect(prismaMock.notification.updateMany)
            .not.toHaveBeenCalled();
        expect(prismaMock.notification.findFirst)
            .not.toHaveBeenCalled();
    });

    it("overrides a Manager target building and derives recipients from scoped Users", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.building.findFirst.mockResolvedValueOnce({
            id: BUILDING_ID
        } as never);
        prismaMock.user.findMany.mockResolvedValueOnce([]);
        prismaMock.notification.createMany.mockResolvedValueOnce({
            count: 0
        });

        const response = await request(notificationApp())
            .post("/notifications/building")
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send({
                building_id: OTHER_BUILDING_ID,
                title: "Notice",
                content: "Scoped content"
            });

        expect(response.status).toBe(201);
        expect(prismaMock.building.findFirst).toHaveBeenCalledWith({
            where: {
                id: BUILDING_ID,
                ...assignmentWhere
            },
            select: { id: true }
        });
        expect(prismaMock.user.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    AND: [managerNotificationUserScope]
                }
            })
        );
    });

    it("does not send to a building recipient who loses Manager scope before the final write", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.building.findFirst.mockResolvedValueOnce({
            id: BUILDING_ID
        } as never);
        prismaMock.user.findMany
            .mockResolvedValueOnce([{
                id: TENANT_USER_ID,
                username: "tenant",
                role: Role.TENANT,
                tenant: {
                    id: TENANT_ID,
                    full_name: "Nguyen Van An"
                },
                staff: null
            }] as never);
        prismaMock.notification.create.mockRejectedValueOnce(
            prismaNotFoundError()
        );

        const response = await request(notificationApp())
            .post("/notifications/building")
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send({
                building_id: BUILDING_ID,
                title: "Notice",
                content: "Scoped content"
            });

        expect(response.status).toBe(404);
        expect(prismaMock.notification.createMany)
            .not.toHaveBeenCalled();
        expect(prismaMock.notification.create).toHaveBeenCalledWith({
            data: {
                title: "Notice",
                content: "Scoped content",
                type: "GENERAL",
                user: {
                    connect: {
                        id: TENANT_USER_ID,
                        AND: [managerNotificationUserScope]
                    }
                }
            }
        });
        expect(prismaMock.$transaction).toHaveBeenCalledWith(
            expect.any(Function),
            {
                isolationLevel:
                    Prisma.TransactionIsolationLevel.Serializable
            }
        );
    });

    it("does not send an invoice notification when the invoice loses Manager scope before the final write", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.invoice.findMany.mockResolvedValueOnce(
            [invoiceRecord] as never
        );
        prismaMock.notification.create.mockRejectedValueOnce(
            prismaNotFoundError()
        );

        const response = await request(notificationApp())
            .post("/notifications/invoices")
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send({ invoice_ids: [invoiceRecord.id] });

        expect(response.status).toBe(404);
        expect(prismaMock.notification.createMany)
            .not.toHaveBeenCalled();
        expect(prismaMock.notification.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                user: {
                    connect: {
                        id: TENANT_USER_ID,
                        tenant: {
                            id: TENANT_ID,
                            invoices: {
                                some: {
                                    id: invoiceRecord.id,
                                    AND: [
                                        {
                                            contract: {
                                                apartment:
                                                    managerApartmentScope
                                            }
                                        },
                                        {
                                            id: {
                                                in: [invoiceRecord.id]
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            })
        });
        expect(prismaMock.$transaction).toHaveBeenCalledWith(
            expect.any(Function),
            {
                isolationLevel:
                    Prisma.TransactionIsolationLevel.Serializable
            }
        );
    });

    it("maps exhausted notification serialization retries to standard 409", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.$transaction
            .mockRejectedValueOnce(prismaSerializationError())
            .mockRejectedValueOnce(prismaSerializationError())
            .mockRejectedValueOnce(prismaSerializationError());

        const response = await request(notificationApp())
            .post("/notifications/building")
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send({
                building_id: BUILDING_ID,
                title: "Notice",
                content: "Scoped content"
            });

        expect(response.status).toBe(409);
        expect(response.body).toEqual({
            success: false,
            error: {
                code: "CONCURRENT_MODIFICATION",
                message: "Notification scope changed during this operation"
            }
        });
        expect(prismaMock.$transaction).toHaveBeenCalledTimes(3);
    });

    it("guards a Tenant notification delete atomically by actor.userId", async () => {
        authenticateAs(Role.TENANT);
        prismaMock.notification.deleteMany.mockResolvedValueOnce({
            count: 0
        });

        const response = await request(notificationApp())
            .delete("/notifications/501")
            .set("Authorization", authorizationFor(Role.TENANT));

        expect(response.status).toBe(404);
        expect(prismaMock.notification.deleteMany).toHaveBeenCalledWith({
            where: {
                id: 501,
                user_id: TENANT_USER_ID
            }
        });
    });
});
