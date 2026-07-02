import { z } from "zod";

const emptyObjectSchema = z.object({}).strict();

export const uploadImagesRequestSchema = z.object({
    params: emptyObjectSchema,
    query: emptyObjectSchema,
    body: emptyObjectSchema.default({})
}).strict();
