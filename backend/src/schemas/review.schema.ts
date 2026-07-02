import { z } from "zod";

const emptyObjectSchema = z.object({}).strict();
const optionalEmptyBodySchema = emptyObjectSchema.default({});
const queryIdSchema = z.coerce.number().int().positive();

export const listApartmentReviewsRequestSchema = z.object({
    params: z.object({
        apartmentId: queryIdSchema
    }).strict(),
    query: z.object({
        page: queryIdSchema.default(1),
        limit: queryIdSchema.max(100).default(10)
    }).strict(),
    body: optionalEmptyBodySchema
}).strict();

export const createReviewRequestSchema = z.object({
    params: emptyObjectSchema,
    query: emptyObjectSchema,
    body: z.object({
        apartment_id: z.number().finite().int().positive(),
        rating: z.number().finite().int().min(1).max(5),
        comment: z.string().trim().max(2000).optional()
    }).strict()
}).strict();

export type ListApartmentReviewsRequest = z.infer<
    typeof listApartmentReviewsRequestSchema
>;
export type CreateReviewRequest = z.infer<
    typeof createReviewRequestSchema
>;
