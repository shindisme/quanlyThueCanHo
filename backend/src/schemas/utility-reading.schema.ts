import { z } from "zod";

const emptyObjectSchema = z.object({}).strict();
const optionalEmptyBodySchema = emptyObjectSchema.default({});
const positiveIdSchema = z.coerce.number().int().positive();
const meterSchema = z.coerce.number().int().nonnegative();
const monthSchema = z.coerce.number().int().min(1).max(12);
const yearSchema = z.coerce.number().int().min(2000).max(3000);

export const listUtilityReadingsRequestSchema = z.object({
    params: emptyObjectSchema,
    query: z.object({
        apartment_id: positiveIdSchema.optional(),
        building_id: positiveIdSchema.optional(),
        month: monthSchema.optional(),
        year: yearSchema.optional(),
        recorded_by: positiveIdSchema.optional(),
        search: z.string().trim().min(1).max(200).optional(),
        page: positiveIdSchema.default(1),
        limit: positiveIdSchema.max(100).default(10)
    }).strict(),
    body: optionalEmptyBodySchema
}).strict();

export const utilityReadingIdRequestSchema = z.object({
    params: z.object({
        id: positiveIdSchema
    }).strict(),
    query: emptyObjectSchema,
    body: optionalEmptyBodySchema
}).strict();

const utilityReadingBodyFields = {
    apartment_id: positiveIdSchema,
    month: monthSchema,
    year: yearSchema,
    electric_old: meterSchema,
    electric_new: meterSchema,
    water_old: meterSchema,
    water_new: meterSchema,
    recorded_by: positiveIdSchema
};

export const createUtilityReadingRequestSchema = z.object({
    params: emptyObjectSchema,
    query: emptyObjectSchema,
    body: z.object({
        apartment_id: utilityReadingBodyFields.apartment_id,
        month: utilityReadingBodyFields.month,
        year: utilityReadingBodyFields.year,
        electric_old: utilityReadingBodyFields.electric_old.optional(),
        electric_new: utilityReadingBodyFields.electric_new,
        water_old: utilityReadingBodyFields.water_old.optional(),
        water_new: utilityReadingBodyFields.water_new,
        recorded_by: utilityReadingBodyFields.recorded_by.optional()
    }).strict()
}).strict();

export const updateUtilityReadingRequestSchema = z.object({
    params: z.object({
        id: positiveIdSchema
    }).strict(),
    query: emptyObjectSchema,
    body: z.object({
        apartment_id: utilityReadingBodyFields.apartment_id.optional(),
        month: utilityReadingBodyFields.month.optional(),
        year: utilityReadingBodyFields.year.optional(),
        electric_old: utilityReadingBodyFields.electric_old.optional(),
        electric_new: utilityReadingBodyFields.electric_new.optional(),
        water_old: utilityReadingBodyFields.water_old.optional(),
        water_new: utilityReadingBodyFields.water_new.optional(),
        recorded_by: utilityReadingBodyFields.recorded_by.optional()
    }).strict().refine(
        (body) => Object.keys(body).length > 0,
        { message: "At least one field must be provided" }
    )
}).strict();

export type ListUtilityReadingsRequest = z.infer<
    typeof listUtilityReadingsRequestSchema
>;
export type UtilityReadingIdRequest = z.infer<
    typeof utilityReadingIdRequestSchema
>;
export type CreateUtilityReadingRequest = z.infer<
    typeof createUtilityReadingRequestSchema
>;
export type UpdateUtilityReadingRequest = z.infer<
    typeof updateUtilityReadingRequestSchema
>;
