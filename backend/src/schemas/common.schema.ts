import { z } from "zod";

export const emptyObjectSchema = z.object({}).strict();
export const optionalEmptyBodySchema = emptyObjectSchema.default({});
export const positiveIdSchema = z.coerce.number().int().positive();
export const idParamsSchema = z.object({
    id: positiveIdSchema
}).strict();
