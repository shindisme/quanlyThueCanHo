import {
    Priority,
    RequestStatus
} from "@prisma/client";
import { z } from "zod";
import {
    emptyObjectSchema,
    idParamsSchema,
    optionalEmptyBodySchema,
    positiveIdSchema
} from "./common.schema.js";
import { strictRfc3339DateSchema } from "./strict-date.schema.js";

export const listMaintenanceRequestSchema = z.object({
    params: emptyObjectSchema,
    query: z.object({
        status: z.nativeEnum(RequestStatus).optional(),
        priority: z.nativeEnum(Priority).optional(),
        building_id: positiveIdSchema.optional(),
        page: positiveIdSchema.default(1),
        limit: positiveIdSchema.max(100).default(10)
    }).strict(),
    body: optionalEmptyBodySchema
}).strict();

export const maintenanceIdRequestSchema = z.object({
    params: idParamsSchema,
    query: emptyObjectSchema,
    body: optionalEmptyBodySchema
}).strict();

export const createMaintenanceRequestSchema = z.object({
    params: emptyObjectSchema,
    query: emptyObjectSchema,
    body: z.object({
        apartment_id: z.number().int().positive(),
        title: z.string().trim().min(1).max(200),
        description: z.string().trim().min(1).max(10_000),
        priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
        image_url: z.url().max(2048).optional()
    }).strict()
}).strict();

export const cancelMaintenanceRequestSchema =
    maintenanceIdRequestSchema;

export const confirmMaintenanceRequestSchema = z.object({
    params: idParamsSchema,
    query: emptyObjectSchema,
    body: z.object({
        assigned_staff_id: z.number().int().positive(),
        scheduled_at: strictRfc3339DateSchema
    }).strict()
}).strict();

export const unableMaintenanceRequestSchema = z.object({
    params: idParamsSchema,
    query: emptyObjectSchema,
    body: z.object({
        reason: z.string().trim().min(1).max(2000)
    }).strict()
}).strict();

const completeMaintenanceBodySchema = z.object({
    charge_tenant: z.boolean().default(false),
    repair_fee: z.number().positive().optional()
}).strict().superRefine((body, context) => {
    if (body.charge_tenant && body.repair_fee === undefined) {
        context.addIssue({
            code: "custom",
            path: ["repair_fee"],
            message: "Cần nhập phí sửa chữa khi lập hóa đơn cho người thuê"
        });
    }
});

export const completeMaintenanceRequestSchema = z.object({
    params: idParamsSchema,
    query: emptyObjectSchema,
    body: completeMaintenanceBodySchema.default({ charge_tenant: false })
}).strict();

export type ListMaintenanceRequest = z.infer<
    typeof listMaintenanceRequestSchema
>;
export type MaintenanceIdRequest = z.infer<
    typeof maintenanceIdRequestSchema
>;
export type CreateMaintenanceRequest = z.infer<
    typeof createMaintenanceRequestSchema
>;
export type ConfirmMaintenanceRequest = z.infer<
    typeof confirmMaintenanceRequestSchema
>;
export type UnableMaintenanceRequest = z.infer<
    typeof unableMaintenanceRequestSchema
>;
export type CompleteMaintenanceRequest = z.infer<
    typeof completeMaintenanceRequestSchema
>;