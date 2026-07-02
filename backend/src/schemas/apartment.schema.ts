import { ApartmentStatus } from "@prisma/client";
import { z } from "zod";

const emptyObjectSchema = z.object({}).strict();
const optionalEmptyBodySchema = emptyObjectSchema.default({});
const positiveIdSchema = z.coerce.number().int().positive();
const positiveNumberSchema = z.coerce.number().positive();

const apartmentFields = {
    building_id: positiveIdSchema,
    floor: z.coerce.number().int().positive(),
    room_number: z.string().trim().min(1).max(50),
    area: positiveNumberSchema,
    bedrooms: z.coerce.number().int().positive(),
    bathrooms: z.coerce.number().int().positive(),
    rental_price: positiveNumberSchema,
    description: z.string().trim().max(5000).nullable().optional(),
    status: z.nativeEnum(ApartmentStatus)
};

export const listApartmentsRequestSchema = z.object({
    params: emptyObjectSchema,
    query: z.object({
        building_id: positiveIdSchema.optional(),
        search: z.string().trim().min(1).max(200).optional(),
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(10),
        status: z.union([
            z.nativeEnum(ApartmentStatus),
            z.array(z.nativeEnum(ApartmentStatus)).min(1).max(3)
        ]).optional()
    }).strict(),
    body: optionalEmptyBodySchema
}).strict();

export const apartmentIdRequestSchema = z.object({
    params: z.object({
        id: positiveIdSchema
    }).strict(),
    query: emptyObjectSchema,
    body: optionalEmptyBodySchema
}).strict();

export const createApartmentRequestSchema = z.object({
    params: emptyObjectSchema,
    query: emptyObjectSchema,
    body: z.object({
        ...apartmentFields,
        building_id: apartmentFields.building_id.optional(),
        status: apartmentFields.status.default(ApartmentStatus.AVAILABLE)
    }).strict()
}).strict();

export const updateApartmentRequestSchema = z.object({
    params: z.object({
        id: positiveIdSchema
    }).strict(),
    query: emptyObjectSchema,
    body: z.object({
        building_id: apartmentFields.building_id.optional(),
        floor: apartmentFields.floor.optional(),
        room_number: apartmentFields.room_number.optional(),
        area: apartmentFields.area.optional(),
        bedrooms: apartmentFields.bedrooms.optional(),
        bathrooms: apartmentFields.bathrooms.optional(),
        rental_price: apartmentFields.rental_price.optional(),
        description: apartmentFields.description,
        status: apartmentFields.status.optional()
    }).strict()
}).strict();

export type ListApartmentsRequest = z.infer<
    typeof listApartmentsRequestSchema
>;
export type ApartmentIdRequest = z.infer<
    typeof apartmentIdRequestSchema
>;
export type CreateApartmentRequest = z.infer<
    typeof createApartmentRequestSchema
>;
export type UpdateApartmentRequest = z.infer<
    typeof updateApartmentRequestSchema
>;
