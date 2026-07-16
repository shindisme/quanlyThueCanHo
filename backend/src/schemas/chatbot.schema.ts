import { z } from "zod";
import { emptyObjectSchema } from "./common.schema.js";

export const chatbotRequestSchema = z.object({
    params: emptyObjectSchema,
    query: emptyObjectSchema,
    body: z.object({
        message: z.string().trim().min(1).max(2000)
    }).strict()
}).strict();

export type ChatbotRequest = z.infer<typeof chatbotRequestSchema>;
