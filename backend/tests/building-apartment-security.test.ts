import {
    ApartmentStatus,
    BuildingStatus,
    Prisma,
    Role,
    UserStatus
} from "@prisma/client";
import request from "supertest";
import {
    beforeEach,
    describe,
    expect,
    it,
    vi
} from "vitest";
import apartmentRouter from "../src/routes/apartment.route.js";
import buildingRouter from "../src/routes/building.route.js";
import { createBearerToken } from "./helpers/auth.js";
import { createTestApp } from "./helpers/test-app.js";
import {
    imageKitDeleteFileMock,
    imageKitUploadMock,
    prismaMock
} from "./setup.js";

const MANAGER_USER_ID = 101;
const ADMIN_USER_ID = 102;
const MANAGER_STAFF_ID = 201;
const BUILDING_ID = 301;
const OTHER_BUILDING_ID = 302;
const APARTMENT_ID = 401;

const prismaNotFoundError = () =>
    new Prisma.PrismaClientKnownRequestError(
        "Record to update not found",
        {
            code: "P2025",
            clientVersion: "6.15.0"
        }
    );

const building = {
    id: BUILDING_ID,
    branch_name: "Central",
    address_old: "12 Old Street",
    address_new: "12 New Street",
    description: "Managed building",
    status: BuildingStatus.ACTIVE,
    total_floors: 8,
    total_apartments: 20,
    thumbnail_url: null,
    created_at: new Date("2026-06-01T00:00:00.000Z"),
    _count: { apartments: 20 },
    assigned_staff: []
};

const apartment = {
    id: APARTMENT_ID,
    building_id: BUILDING_ID,
    room_number: "A101",
    floor: 1,
    area: 55,
    bedrooms: 2,
    bathrooms: 1,
    rental_price: 8_000_000,
    description: "Bright apartment",
    status: ApartmentStatus.AVAILABLE,
    building: {
        id: BUILDING_ID,
        branch_name: "Central",
        address_old: "12 Old Street",
        address_new: "12 New Street",
        total_floors: 8
    },
    images: []
};

const validBuildingBody = {
    branch_name: "Central",
    address_old: "12 Old Street",
    address_new: "12 New Street",
    description: "Managed building",
    status: BuildingStatus.ACTIVE,
    total_floors: 8
};

const validApartmentBody = {
    building_id: BUILDING_ID,
    floor: 1,
    room_number: "A101",
    area: 55,
    bedrooms: 2,
    bathrooms: 1,
    rental_price: 8_000_000,
    description: "Bright apartment",
    status: ApartmentStatus.AVAILABLE
};

const authenticationRecord = (
    role: Role,
    buildingId: number | null = role === Role.MANAGER
        ? BUILDING_ID
        : null
) => ({
    id: role === Role.ADMIN ? ADMIN_USER_ID : MANAGER_USER_ID,
    role,
    status: UserStatus.ACTIVE,
    staff: role === Role.ADMIN
        ? null
        : {
            id: MANAGER_STAFF_ID,
            building_id: buildingId
        },
    tenant: null
});

const authenticateAs = (
    role: Role,
    buildingId?: number | null
) => {
    prismaMock.user.findUnique.mockResolvedValueOnce(
        authenticationRecord(
            role,
            buildingId === undefined
                ? role === Role.MANAGER
                    ? BUILDING_ID
                    : null
                : buildingId
        ) as never
    );
};

const buildingApp = () => createTestApp(buildingRouter, "/buildings");
const apartmentApp = () => createTestApp(apartmentRouter, "/apartments");

beforeEach(() => {
    vi.clearAllMocks();
});

describe("public building and apartment reads", () => {
    it("keeps the building list public, validates pagination, and uses the standard envelope", async () => {
        prismaMock.$transaction.mockResolvedValueOnce([
            [building],
            1
        ] as never);

        const response = await request(buildingApp())
            .get("/buildings?page=2&limit=5&search=Central");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            success: true,
            data: [{
                ...building,
                created_at: building.created_at.toISOString(),
                name: building.branch_name
            }],
            meta: {
                pagination: {
                    page: 2,
                    limit: 5,
                    total: 1,
                    totalPages: 1
                }
            }
        });
        expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });

    it("keeps building detail public and returns a standard success envelope", async () => {
        prismaMock.building.findUnique.mockResolvedValueOnce(
            building as never
        );

        const response = await request(buildingApp())
            .get(`/buildings/${BUILDING_ID}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            success: true,
            data: {
                ...building,
                created_at: building.created_at.toISOString(),
                name: building.branch_name
            }
        });
        expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });

    it("keeps the apartment list public with coerced filters and standard pagination", async () => {
        prismaMock.$transaction.mockResolvedValueOnce([
            [apartment],
            1
        ] as never);

        const response = await request(apartmentApp())
            .get(
                `/apartments?building_id=${BUILDING_ID}`
                + "&page=2&limit=5&status=AVAILABLE"
            );

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            success: true,
            data: [apartment],
            meta: {
                pagination: {
                    page: 2,
                    limit: 5,
                    total: 1,
                    totalPages: 1
                }
            }
        });
        expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });

    it("keeps apartment detail public and returns 404 in the standard envelope", async () => {
        prismaMock.apartment.findUnique.mockResolvedValueOnce(null);

        const response = await request(apartmentApp())
            .get(`/apartments/${APARTMENT_ID}`);

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            success: false,
            error: {
                code: "NOT_FOUND",
                message: "Apartment was not found"
            }
        });
        expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });

    it.each([
        [buildingApp, "/buildings?page=0", "building pagination"],
        [buildingApp, "/buildings/0", "building id"],
        [apartmentApp, "/apartments?limit=101", "apartment pagination"],
        [
            apartmentApp,
            "/apartments?status=UNKNOWN",
            "apartment status"
        ]
    ])("rejects invalid public %s inputs before Prisma", async (
        appFactory,
        path
    ) => {
        const response = await request(appFactory()).get(path);

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe("VALIDATION_ERROR");
        expect(prismaMock.building.findMany).not.toHaveBeenCalled();
        expect(prismaMock.apartment.findMany).not.toHaveBeenCalled();
    });
});

describe("write authentication and router ordering", () => {
    it.each([
        ["post", "/buildings", validBuildingBody, buildingApp],
        ["put", `/buildings/${BUILDING_ID}`, { branch_name: "Renamed" }, buildingApp],
        ["delete", `/buildings/${BUILDING_ID}`, undefined, buildingApp],
        ["post", "/apartments", validApartmentBody, apartmentApp],
        ["put", `/apartments/${APARTMENT_ID}`, { floor: 2 }, apartmentApp],
        ["delete", `/apartments/${APARTMENT_ID}`, undefined, apartmentApp]
    ] as const)(
        "returns 401 for anonymous %s %s",
        async (method, path, body, appFactory) => {
            let pending = request(appFactory())[method](path);

            if (body !== undefined) {
                pending = pending.send(body);
            }

            const response = await pending;

            expect(response.status).toBe(401);
            expect(response.body.error.code).toBe(
                "AUTHENTICATION_REQUIRED"
            );
            expect(prismaMock.building.create).not.toHaveBeenCalled();
            expect(prismaMock.building.update).not.toHaveBeenCalled();
            expect(prismaMock.building.delete).not.toHaveBeenCalled();
            expect(prismaMock.apartment.create).not.toHaveBeenCalled();
            expect(prismaMock.apartment.update).not.toHaveBeenCalled();
            expect(prismaMock.apartment.delete).not.toHaveBeenCalled();
        }
    );

    it("authenticates before parsing a malformed building upload", async () => {
        const response = await request(buildingApp())
            .post("/buildings")
            .set("Content-Type", "multipart/form-data")
            .send("not-a-valid-multipart-body");

        expect(response.status).toBe(401);
        expect(response.body.error.code).toBe(
            "AUTHENTICATION_REQUIRED"
        );
        expect(imageKitUploadMock).not.toHaveBeenCalled();
    });
});

describe("building write authorization and scope", () => {
    it.each([
        ["post", "/buildings", validBuildingBody],
        ["delete", `/buildings/${BUILDING_ID}`, undefined]
    ] as const)(
        "forbids Manager %s %s",
        async (method, path, body) => {
            authenticateAs(Role.MANAGER);
            let pending = request(buildingApp())[method](path)
                .set(
                    "Authorization",
                    createBearerToken(MANAGER_USER_ID)
                );

            if (body !== undefined) {
                pending = pending.send(body);
            }

            const response = await pending;

            expect(response.status).toBe(403);
            expect(response.body.error.code).toBe("FORBIDDEN");
            expect(prismaMock.building.create).not.toHaveBeenCalled();
            expect(prismaMock.building.delete).not.toHaveBeenCalled();
        }
    );

    it("requires a current building assignment for Manager update", async () => {
        authenticateAs(Role.MANAGER, null);

        const response = await request(buildingApp())
            .put(`/buildings/${BUILDING_ID}`)
            .set("Authorization", createBearerToken(MANAGER_USER_ID))
            .send({ branch_name: "Renamed" });

        expect(response.status).toBe(403);
        expect(response.body.error.code).toBe(
            "MANAGER_BUILDING_REQUIRED"
        );
        expect(prismaMock.building.updateMany).not.toHaveBeenCalled();
    });

    it("conceals a different building from Manager update", async () => {
        authenticateAs(Role.MANAGER);

        const response = await request(buildingApp())
            .put(`/buildings/${OTHER_BUILDING_ID}`)
            .set("Authorization", createBearerToken(MANAGER_USER_ID))
            .send({ branch_name: "Renamed" });

        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe("NOT_FOUND");
        expect(prismaMock.building.updateMany).not.toHaveBeenCalled();
        expect(prismaMock.building.update).not.toHaveBeenCalled();
    });

    it("updates the Manager building through a final guarded mutation", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.building.updateMany.mockResolvedValueOnce({ count: 1 });
        prismaMock.building.findUnique.mockResolvedValueOnce({
            ...building,
            branch_name: "Renamed"
        } as never);

        const response = await request(buildingApp())
            .put(`/buildings/${BUILDING_ID}`)
            .set("Authorization", createBearerToken(MANAGER_USER_ID))
            .send({ branch_name: "Renamed" });

        expect(response.status).toBe(200);
        expect(prismaMock.building.updateMany).toHaveBeenCalledWith({
            where: {
                id: BUILDING_ID
            },
            data: {
                branch_name: "Renamed"
            }
        });
        expect(prismaMock.building.update).not.toHaveBeenCalled();
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe("Renamed");
    });

    it("returns 404 when Manager loses scope at the guarded building mutation", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.building.updateMany.mockResolvedValueOnce({ count: 0 });

        const response = await request(buildingApp())
            .put(`/buildings/${BUILDING_ID}`)
            .set("Authorization", createBearerToken(MANAGER_USER_ID))
            .send({ branch_name: "Renamed" });

        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe("NOT_FOUND");
        expect(prismaMock.building.updateMany).toHaveBeenCalledWith({
            where: { id: BUILDING_ID },
            data: { branch_name: "Renamed" }
        });
        expect(prismaMock.building.update).not.toHaveBeenCalled();
    });

    it("forbids Manager assignment changes and rejects unknown privilege fields", async () => {
        authenticateAs(Role.MANAGER);

        const assignmentResponse = await request(buildingApp())
            .put(`/buildings/${BUILDING_ID}`)
            .set("Authorization", createBearerToken(MANAGER_USER_ID))
            .send({ staff_id: 999 });

        expect(assignmentResponse.status).toBe(403);
        expect(assignmentResponse.body.error.code).toBe("FORBIDDEN");
        expect(prismaMock.building.updateMany).not.toHaveBeenCalled();

        authenticateAs(Role.MANAGER);

        const privilegeResponse = await request(buildingApp())
            .put(`/buildings/${BUILDING_ID}`)
            .set("Authorization", createBearerToken(MANAGER_USER_ID))
            .send({ total_apartments: 999 });

        expect(privilegeResponse.status).toBe(400);
        expect(privilegeResponse.body.error.code).toBe(
            "VALIDATION_ERROR"
        );
        expect(prismaMock.building.updateMany).not.toHaveBeenCalled();
    });

    it("rejects Manager multipart staff assignment before any external image work", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.building.findUnique.mockResolvedValueOnce({
            ...building,
            thumbnail_url: "https://ik.imagekit.io/demo/old-building.jpg"
        } as never);
        imageKitUploadMock.mockResolvedValueOnce({
            url: "https://images.example/new-building.jpg"
        });
        imageKitDeleteFileMock.mockResolvedValueOnce(undefined);

        const response = await request(buildingApp())
            .put(`/buildings/${BUILDING_ID}`)
            .set("Authorization", createBearerToken(MANAGER_USER_ID))
            .field("staff_id", "999")
            .attach("image", Buffer.from("image"), "building.jpg");

        expect(response.status).toBe(403);
        expect(response.body.error.code).toBe("FORBIDDEN");
        expect(imageKitUploadMock).not.toHaveBeenCalled();
        expect(imageKitDeleteFileMock).not.toHaveBeenCalled();
        expect(prismaMock.building.updateMany).not.toHaveBeenCalled();
        expect(prismaMock.building.update).not.toHaveBeenCalled();
    });

    it("allows Admin to create, update, and delete buildings globally", async () => {
        authenticateAs(Role.ADMIN);
        prismaMock.building.create.mockResolvedValueOnce(building as never);

        const createResponse = await request(buildingApp())
            .post("/buildings")
            .set("Authorization", createBearerToken(ADMIN_USER_ID))
            .send(validBuildingBody);

        expect(createResponse.status).toBe(201);
        expect(createResponse.body.success).toBe(true);
        expect(prismaMock.building.create).toHaveBeenCalledOnce();

        authenticateAs(Role.ADMIN);
        prismaMock.building.update.mockResolvedValueOnce({
            ...building,
            branch_name: "Global"
        } as never);

        const updateResponse = await request(buildingApp())
            .put(`/buildings/${OTHER_BUILDING_ID}`)
            .set("Authorization", createBearerToken(ADMIN_USER_ID))
            .send({ branch_name: "Global" });

        expect(updateResponse.status).toBe(200);
        expect(prismaMock.building.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: OTHER_BUILDING_ID },
                data: { branch_name: "Global" }
            })
        );

        authenticateAs(Role.ADMIN);
        prismaMock.building.delete.mockResolvedValueOnce(building as never);

        const deleteResponse = await request(buildingApp())
            .delete(`/buildings/${OTHER_BUILDING_ID}`)
            .set("Authorization", createBearerToken(ADMIN_USER_ID));

        expect(deleteResponse.status).toBe(200);
        expect(deleteResponse.body).toEqual({
            success: true,
            data: { deleted: true }
        });
        expect(prismaMock.building.delete).toHaveBeenCalledWith({
            where: { id: OTHER_BUILDING_ID }
        });
    });
});

describe("apartment write authorization and scope", () => {
    it("forces the current Manager building on create despite a malicious client value", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.apartment.create.mockResolvedValueOnce(apartment as never);
        prismaMock.$transaction.mockImplementationOnce(
            async (operation) => (
                operation as (
                    client: typeof prismaMock
                ) => Promise<unknown>
            )(prismaMock)
        );

        const response = await request(apartmentApp())
            .post("/apartments")
            .set("Authorization", createBearerToken(MANAGER_USER_ID))
            .send({
                ...validApartmentBody,
                building_id: String(OTHER_BUILDING_ID),
                floor: "1",
                area: "55.5",
                bedrooms: "2",
                bathrooms: "1",
                rental_price: "8000000"
            });

        expect(response.status).toBe(201);
        expect(prismaMock.apartment.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                building_id: BUILDING_ID,
                floor: 1,
                area: 55.5,
                bedrooms: 2,
                bathrooms: 1,
                rental_price: 8_000_000
            })
        });
        expect(response.body.success).toBe(true);
    });

    it("requires a current building assignment for Manager apartment create", async () => {
        authenticateAs(Role.MANAGER, null);

        const response = await request(apartmentApp())
            .post("/apartments")
            .set("Authorization", createBearerToken(MANAGER_USER_ID))
            .send(validApartmentBody);

        expect(response.status).toBe(403);
        expect(response.body.error.code).toBe(
            "MANAGER_BUILDING_REQUIRED"
        );
        expect(prismaMock.apartment.create).not.toHaveBeenCalled();
    });

    it("rejects an Admin create without building_id before external image upload", async () => {
        authenticateAs(Role.ADMIN);
        imageKitUploadMock.mockResolvedValueOnce({
            url: "https://images.example/apartment.jpg"
        });

        const response = await request(apartmentApp())
            .post("/apartments")
            .set("Authorization", createBearerToken(ADMIN_USER_ID))
            .field("floor", "1")
            .field("room_number", "A101")
            .field("area", "55")
            .field("bedrooms", "2")
            .field("bathrooms", "1")
            .field("rental_price", "8000000")
            .field("status", ApartmentStatus.AVAILABLE)
            .attach("images", Buffer.from("image"), "apartment.jpg");

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe("VALIDATION_ERROR");
        expect(imageKitUploadMock).not.toHaveBeenCalled();
        expect(prismaMock.apartment.create).not.toHaveBeenCalled();
    });

    it("updates an apartment with a final Manager building guard", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.apartment.update.mockResolvedValueOnce({
            ...apartment,
            floor: 2
        } as never);

        const response = await request(apartmentApp())
            .put(`/apartments/${APARTMENT_ID}`)
            .set("Authorization", createBearerToken(MANAGER_USER_ID))
            .send({ floor: "2" });

        expect(response.status).toBe(200);
        expect(prismaMock.apartment.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    id: APARTMENT_ID,
                    building_id: BUILDING_ID
                },
                data: { floor: 2 }
            })
        );
        expect(prismaMock.apartment.updateMany).not.toHaveBeenCalled();
        expect(response.body.success).toBe(true);
    });

    it("maps a no-match final scoped Manager update to standard 404", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.apartment.update.mockRejectedValueOnce(
            prismaNotFoundError()
        );

        const response = await request(apartmentApp())
            .put(`/apartments/${APARTMENT_ID}`)
            .set("Authorization", createBearerToken(MANAGER_USER_ID))
            .send({ floor: 2 });

        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe("NOT_FOUND");
        expect(prismaMock.apartment.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    id: APARTMENT_ID,
                    building_id: BUILDING_ID
                }
            })
        );
        expect(prismaMock.apartment.updateMany).not.toHaveBeenCalled();
    });

    it("nests Manager image writes in the final scoped apartment update after preflight", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.apartment.findFirst.mockResolvedValueOnce({
            id: APARTMENT_ID
        } as never);
        prismaMock.apartmentImage.count.mockResolvedValueOnce(0);
        imageKitUploadMock.mockResolvedValueOnce({
            url: "https://images.example/apartment-new.jpg"
        });
        prismaMock.apartment.update.mockResolvedValueOnce({
            ...apartment,
            description: "Updated with image"
        } as never);

        const response = await request(apartmentApp())
            .put(`/apartments/${APARTMENT_ID}`)
            .set("Authorization", createBearerToken(MANAGER_USER_ID))
            .field("description", "Updated with image")
            .attach("images", Buffer.from("image"), "apartment.jpg");

        expect(response.status).toBe(200);
        expect(
            prismaMock.apartment.findFirst.mock.invocationCallOrder[0]
        ).toBeLessThan(
            imageKitUploadMock.mock.invocationCallOrder[0]
        );
        expect(prismaMock.apartment.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    id: APARTMENT_ID,
                    building_id: BUILDING_ID
                },
                data: {
                    description: "Updated with image",
                    images: {
                        create: [{
                            image_url:
                                "https://images.example/apartment-new.jpg",
                            is_thumbnail: true
                        }]
                    }
                }
            })
        );
        expect(prismaMock.apartment.updateMany).not.toHaveBeenCalled();
        expect(
            prismaMock.apartmentImage.createMany
        ).not.toHaveBeenCalled();
    });

    it("returns 404 without unscoped image writes when Manager loses scope at the final update", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.apartment.findFirst.mockResolvedValueOnce({
            id: APARTMENT_ID
        } as never);
        prismaMock.apartmentImage.count.mockResolvedValueOnce(2);
        imageKitUploadMock.mockResolvedValueOnce({
            url: "https://images.example/apartment-new.jpg"
        });
        prismaMock.apartment.update.mockRejectedValueOnce(
            prismaNotFoundError()
        );

        const response = await request(apartmentApp())
            .put(`/apartments/${APARTMENT_ID}`)
            .set("Authorization", createBearerToken(MANAGER_USER_ID))
            .field("description", "Scope changed")
            .attach("images", Buffer.from("image"), "apartment.jpg");

        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe("NOT_FOUND");
        expect(prismaMock.apartment.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    id: APARTMENT_ID,
                    building_id: BUILDING_ID
                },
                data: expect.objectContaining({
                    images: {
                        create: [{
                            image_url:
                                "https://images.example/apartment-new.jpg",
                            is_thumbnail: false
                        }]
                    }
                })
            })
        );
        expect(prismaMock.apartment.updateMany).not.toHaveBeenCalled();
        expect(
            prismaMock.apartmentImage.createMany
        ).not.toHaveBeenCalled();
    });

    it("ignores a Manager attempt to move an apartment to another building", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.apartment.update.mockResolvedValueOnce(apartment as never);

        const response = await request(apartmentApp())
            .put(`/apartments/${APARTMENT_ID}`)
            .set("Authorization", createBearerToken(MANAGER_USER_ID))
            .send({
                building_id: OTHER_BUILDING_ID,
                description: "Still managed here"
            });

        expect(response.status).toBe(200);
        expect(prismaMock.apartment.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    id: APARTMENT_ID,
                    building_id: BUILDING_ID
                },
                data: {
                    description: "Still managed here"
                }
            })
        );
    });

    it.each([
        [1, 200],
        [0, 404]
    ])(
        "guards Manager apartment delete atomically when count is %s",
        async (count, expectedStatus) => {
            authenticateAs(Role.MANAGER);
            prismaMock.apartment.deleteMany.mockResolvedValueOnce({ count });

            const response = await request(apartmentApp())
                .delete(`/apartments/${APARTMENT_ID}`)
                .set(
                    "Authorization",
                    createBearerToken(MANAGER_USER_ID)
                );

            expect(response.status).toBe(expectedStatus);
            expect(prismaMock.apartment.deleteMany).toHaveBeenCalledWith({
                where: {
                    id: APARTMENT_ID,
                    building_id: BUILDING_ID
                }
            });
            expect(prismaMock.apartment.delete).not.toHaveBeenCalled();
        }
    );

    it("allows Admin to create, update, and delete apartments globally", async () => {
        authenticateAs(Role.ADMIN);
        prismaMock.apartment.create.mockResolvedValueOnce({
            ...apartment,
            building_id: OTHER_BUILDING_ID
        } as never);
        prismaMock.$transaction.mockImplementationOnce(
            async (operation) => (
                operation as (
                    client: typeof prismaMock
                ) => Promise<unknown>
            )(prismaMock)
        );

        const createResponse = await request(apartmentApp())
            .post("/apartments")
            .set("Authorization", createBearerToken(ADMIN_USER_ID))
            .send({
                ...validApartmentBody,
                building_id: OTHER_BUILDING_ID
            });

        expect(createResponse.status).toBe(201);
        expect(prismaMock.apartment.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                building_id: OTHER_BUILDING_ID
            })
        });

        authenticateAs(Role.ADMIN);
        prismaMock.apartment.update.mockResolvedValueOnce({
            ...apartment,
            building_id: OTHER_BUILDING_ID
        } as never);

        const updateResponse = await request(apartmentApp())
            .put(`/apartments/${APARTMENT_ID}`)
            .set("Authorization", createBearerToken(ADMIN_USER_ID))
            .send({ building_id: OTHER_BUILDING_ID });

        expect(updateResponse.status).toBe(200);
        expect(prismaMock.apartment.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: APARTMENT_ID },
                data: { building_id: OTHER_BUILDING_ID }
            })
        );

        authenticateAs(Role.ADMIN);
        prismaMock.apartment.delete.mockResolvedValueOnce(apartment as never);

        const deleteResponse = await request(apartmentApp())
            .delete(`/apartments/${APARTMENT_ID}`)
            .set("Authorization", createBearerToken(ADMIN_USER_ID));

        expect(deleteResponse.status).toBe(200);
        expect(deleteResponse.body).toEqual({
            success: true,
            data: { deleted: true }
        });
        expect(prismaMock.apartment.delete).toHaveBeenCalledWith({
            where: { id: APARTMENT_ID }
        });
    });

    it("strictly validates apartment writes before any mutation", async () => {
        authenticateAs(Role.MANAGER);

        const response = await request(apartmentApp())
            .put(`/apartments/${APARTMENT_ID}`)
            .set("Authorization", createBearerToken(MANAGER_USER_ID))
            .send({
                status: "BROKEN",
                privileged: true
            });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe("VALIDATION_ERROR");
        expect(prismaMock.apartment.updateMany).not.toHaveBeenCalled();
        expect(prismaMock.apartment.update).not.toHaveBeenCalled();
    });
});
