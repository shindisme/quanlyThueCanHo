import { BuildingStatus } from "@prisma/client";
import { z } from "zod";
import {
    emptyObjectSchema,
    idParamsSchema,
    optionalEmptyBodySchema,
    positiveIdSchema
} from "./common.schema.js";

const paginationSchema = {
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10)
};

const nullableCoordinate = (minimum: number, maximum: number) =>
    z.preprocess(
        (value) => value === "" || value === "null" ? null : value,
        z.coerce.number().finite().min(minimum).max(maximum).nullable()
    ).optional();

const coordinatesFields = {
    latitude: nullableCoordinate(-90, 90),
    longitude: nullableCoordinate(-180, 180)
};

const validateCoordinatePair = (
    value: { latitude?: number | null; longitude?: number | null },
    context: z.RefinementCtx
) => {
    const hasLatitude = value.latitude !== undefined;
    const hasLongitude = value.longitude !== undefined;

    if (hasLatitude !== hasLongitude || value.latitude === null !== (value.longitude === null)) {
        context.addIssue({
            code: "custom",
            path: ["latitude"],
            message: "Latitude và longitude phải được gửi cùng nhau"
        });
    }
};

const buildingFields = {
    branch_name: z.string().trim().min(1).max(200),
    address: z.string().trim().min(1).max(500),
    address_old: z.string().trim().min(1).max(500).optional(),
    address_new: z.string().trim().min(1).max(500).optional(),
    description: z.string().trim().max(5000).nullable().optional(),
    status: z.nativeEnum(BuildingStatus),
    total_floors: z.coerce.number().int().positive(),
    staff_id: z.coerce.number().int().positive().nullable().optional(),
    ...coordinatesFields
};

export const listBuildingsRequestSchema = z.object({
    params: emptyObjectSchema,
    query: z.object({
        search: z.string().trim().min(1).max(200).optional(),
        branch_name: z.string().trim().min(1).max(200).optional(),
        staff: positiveIdSchema.optional(),
        ...paginationSchema
    }).strict(),
    body: optionalEmptyBodySchema
}).strict();

export const buildingIdRequestSchema = z.object({
    params: idParamsSchema,
    query: emptyObjectSchema,
    body: optionalEmptyBodySchema
}).strict();

export const createBuildingRequestSchema = z.object({
    params: emptyObjectSchema,
    query: emptyObjectSchema,
    body: z.object({
        ...buildingFields,
        status: buildingFields.status.default(BuildingStatus.ACTIVE)
    }).strict().superRefine(validateCoordinatePair)
}).strict();

export const updateBuildingRequestSchema = z.object({
    params: idParamsSchema,
    query: emptyObjectSchema,
    body: z.object({
        branch_name: buildingFields.branch_name.optional(),
        address: buildingFields.address.optional(),
        address_old: buildingFields.address_old.optional(),
        address_new: buildingFields.address_new.optional(),
        description: buildingFields.description,
        status: buildingFields.status.optional(),
        total_floors: buildingFields.total_floors.optional(),
        staff_id: buildingFields.staff_id,
        ...coordinatesFields,
        remove_thumbnail: z.coerce.boolean().optional(),
        thumbnail_url: z.string().nullable().optional()
    }).strict().superRefine(validateCoordinatePair)
}).strict();

export type ListBuildingsRequest = z.infer<
    typeof listBuildingsRequestSchema
>;
export type BuildingIdRequest = z.infer<
    typeof buildingIdRequestSchema
>;
export type CreateBuildingRequest = z.infer<
    typeof createBuildingRequestSchema
>;
export type UpdateBuildingRequest = z.infer<
    typeof updateBuildingRequestSchema
>;
