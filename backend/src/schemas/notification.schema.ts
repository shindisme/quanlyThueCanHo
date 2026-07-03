import {
    InvoiceStatus
} from "@prisma/client";
import { z } from "zod";

const emptyObjectSchema = z.object({}).strict();
const optionalEmptyBodySchema = emptyObjectSchema.default({});
const positiveIdSchema = z.coerce.number().int().positive();
const monthSchema = z.coerce.number().int().min(1).max(12);
const yearSchema = z.coerce.number().int().min(2000).max(3000);
const idListSchema = z.array(
    z.coerce.number().int().positive()
).min(1).max(500);
const optionalTextSchema = z.string().trim().min(1).max(10_000);
const queryBooleanSchema = z.preprocess(
    (value) => value === "true"
        ? true
        : value === "false"
            ? false
            : value,
    z.boolean()
);

export const listNotificationsRequestSchema = z.object({
    params: emptyObjectSchema,
    query: z.object({
        type: z.string().trim().min(1).max(100).optional(),
        is_read: queryBooleanSchema.optional(),
        user_id: positiveIdSchema.optional(),
        tenant_id: positiveIdSchema.optional(),
        building_id: positiveIdSchema.optional(),
        search: z.string().trim().min(1).max(200).optional(),
        page: positiveIdSchema.default(1),
        limit: positiveIdSchema.max(100).default(10)
    }).strict(),
    body: optionalEmptyBodySchema
}).strict();

export const sendBuildingNotificationRequestSchema = z.object({
    params: emptyObjectSchema,
    query: emptyObjectSchema,
    body: z.object({
        building_id: positiveIdSchema,
        title: z.string().trim().min(1).max(200),
        content: optionalTextSchema,
        type: z.string().trim().min(1).max(100).default("GENERAL"),
        apartment_ids: idListSchema.optional(),
        tenant_ids: idListSchema.optional()
    }).strict()
}).strict();

export const sendInvoiceNotificationsRequestSchema = z.object({
    params: emptyObjectSchema,
    query: emptyObjectSchema,
    body: z.object({
        building_id: positiveIdSchema.optional(),
        invoice_ids: idListSchema.optional(),
        tenant_ids: idListSchema.optional(),
        month: monthSchema.optional(),
        year: yearSchema.optional(),
        status: z.nativeEnum(InvoiceStatus).optional(),
        title: z.string().trim().min(1).max(200).optional(),
        content: optionalTextSchema.optional()
    }).strict().refine(
        (body) => (
            body.building_id !== undefined
            || body.invoice_ids !== undefined
        ),
        {
            message: "building_id or invoice_ids is required",
            path: ["building_id"]
        }
    ).refine(
        (body) => (
            body.month === undefined
            && body.year === undefined
        ) || (
            body.month !== undefined
            && body.year !== undefined
        ),
        {
            message: "month and year must be provided together",
            path: ["month"]
        }
    )
}).strict();

export const notificationIdRequestSchema = z.object({
    params: z.object({
        id: positiveIdSchema
    }).strict(),
    query: emptyObjectSchema,
    body: optionalEmptyBodySchema
}).strict();

export const markNotificationReadRequestSchema = z.object({
    params: z.object({
        id: positiveIdSchema
    }).strict(),
    query: emptyObjectSchema,
    body: z.preprocess(
        (value) => value ?? {},
        z.object({
            is_read: z.boolean().default(true)
        }).strict()
    )
}).strict();

export const markAllNotificationsReadRequestSchema = z.object({
    params: emptyObjectSchema,
    query: emptyObjectSchema,
    body: optionalEmptyBodySchema
}).strict();

export type ListNotificationsRequest = z.infer<
    typeof listNotificationsRequestSchema
>;
export type SendBuildingNotificationRequest = z.infer<
    typeof sendBuildingNotificationRequestSchema
>;
export type SendInvoiceNotificationsRequest = z.infer<
    typeof sendInvoiceNotificationsRequestSchema
>;
export type NotificationIdRequest = z.infer<
    typeof notificationIdRequestSchema
>;
export type MarkNotificationReadRequest = z.infer<
    typeof markNotificationReadRequestSchema
>;
