import { z } from "zod";
import { emptyObjectSchema } from "./common.schema.js";

export const uploadImagesRequestSchema = z.object({
    params: emptyObjectSchema,
    query: emptyObjectSchema,
    body: emptyObjectSchema.default({})
}).strict();
