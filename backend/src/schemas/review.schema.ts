import { z } from "zod";
import {
    emptyObjectSchema,
    optionalEmptyBodySchema,
    positiveIdSchema as queryIdSchema
} from "./common.schema.js";

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

export const getMyReviewsRequestSchema = z.object({
    params: emptyObjectSchema,
    query: emptyObjectSchema,
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
export type GetMyReviewsRequest = z.infer<
    typeof getMyReviewsRequestSchema
>;
export type CreateReviewRequest = z.infer<
    typeof createReviewRequestSchema
>;
