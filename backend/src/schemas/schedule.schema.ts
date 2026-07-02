import {
    ScheduleStatus
} from "@prisma/client";
import { z } from "zod";
import {
    strictDateOnlySchema,
    strictRfc3339DateSchema
} from "./strict-date.schema.js";

const emptyObjectSchema = z.object({}).strict();
const optionalEmptyBodySchema = emptyObjectSchema.default({});
const positiveIdSchema = z.coerce.number().int().positive();

export const bookViewingRequestSchema = z.object({
    params: emptyObjectSchema,
    query: emptyObjectSchema,
    body: z.object({
        apartment_id: positiveIdSchema,
        guest_name: z.string().trim().min(2).max(200),
        guest_phone: z.string().trim().min(8).max(30),
        guest_email: z.email().max(320),
        schedule_time: strictRfc3339DateSchema
    }).strict()
}).strict();

export const viewingAvailabilityRequestSchema = z.object({
    params: emptyObjectSchema,
    query: z.object({
        apartment_id: positiveIdSchema,
        date: strictDateOnlySchema
    }).strict(),
    body: optionalEmptyBodySchema
}).strict();

export const listSchedulesRequestSchema = z.object({
    params: emptyObjectSchema,
    query: z.object({
        building_id: positiveIdSchema.optional(),
        apartment_id: positiveIdSchema.optional(),
        status: z.nativeEnum(ScheduleStatus).optional(),
        date: strictDateOnlySchema.optional(),
        guestName: z.string().trim().min(1).max(200).optional(),
        page: positiveIdSchema.default(1),
        limit: positiveIdSchema.max(100).default(10)
    }).strict(),
    body: optionalEmptyBodySchema
}).strict();

export const scheduleIdRequestSchema = z.object({
    params: z.object({
        id: positiveIdSchema
    }).strict(),
    query: emptyObjectSchema,
    body: optionalEmptyBodySchema
}).strict();

export const confirmScheduleRequestSchema = z.object({
    params: z.object({
        id: positiveIdSchema
    }).strict(),
    query: emptyObjectSchema,
    body: z.object({
        status: z.literal(ScheduleStatus.CONFIRMED).optional()
    }).strict().default({})
}).strict();

export type BookViewingRequest = z.infer<
    typeof bookViewingRequestSchema
>;
export type ViewingAvailabilityRequest = z.infer<
    typeof viewingAvailabilityRequestSchema
>;
export type ListSchedulesRequest = z.infer<
    typeof listSchedulesRequestSchema
>;
export type ScheduleIdRequest = z.infer<
    typeof scheduleIdRequestSchema
>;
export type ConfirmScheduleRequest = z.infer<
    typeof confirmScheduleRequestSchema
>;
