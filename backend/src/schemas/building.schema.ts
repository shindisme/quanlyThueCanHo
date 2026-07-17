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

const buildingFields = {
    branch_name: z.string().trim().min(1).max(200),
    address_old: z.string().trim().min(1).max(500),
    address_new: z.string().trim().min(1).max(500),
    description: z.string().trim().max(5000).nullable().optional(),
    status: z.nativeEnum(BuildingStatus),
    total_floors: z.coerce.number().int().positive(),
    staff_id: z.coerce.number().int().positive().nullable().optional()
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
    }).strict()
}).strict();

export const updateBuildingRequestSchema = z.object({
    params: idParamsSchema,
    query: emptyObjectSchema,
    body: z.object({
        branch_name: buildingFields.branch_name.optional(),
        address_old: buildingFields.address_old.optional(),
        address_new: buildingFields.address_new.optional(),
        description: buildingFields.description,
        status: buildingFields.status.optional(),
        total_floors: buildingFields.total_floors.optional(),
        staff_id: buildingFields.staff_id
    }).strict()
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
