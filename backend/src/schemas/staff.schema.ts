import { z } from "zod";
import {
    emptyObjectSchema,
    idParamsSchema,
    optionalEmptyBodySchema,
    positiveIdSchema
} from "./common.schema.js";

export const staffPositionSchema = z.enum([
    "Quản lý",
    "Bảo vệ",
    "Vệ sinh",
    "Kỹ thuật",
    "Kế toán"
]);

const staffFields = {
    full_name: z.string().trim().min(1).max(200),
    phone: z.string()
        .trim()
        .regex(/^\+?\d{9,15}$/)
        .nullable()
        .optional(),
    position: staffPositionSchema,
    building_id: positiveIdSchema.nullable().optional()
};

export const listStaffRequestSchema = z.object({
    params: emptyObjectSchema,
    query: z.object({
        search: z.string().trim().min(1).max(200).optional(),
        position: staffPositionSchema.optional(),
        building_id: positiveIdSchema.optional(),
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(10)
    }).strict(),
    body: optionalEmptyBodySchema
}).strict();

export const staffIdRequestSchema = z.object({
    params: idParamsSchema,
    query: emptyObjectSchema,
    body: optionalEmptyBodySchema
}).strict();

export const createStaffRequestSchema = z.object({
    params: emptyObjectSchema,
    query: emptyObjectSchema,
    body: z.object(staffFields).strict()
}).strict();

export const updateStaffRequestSchema = z.object({
    params: idParamsSchema,
    query: emptyObjectSchema,
    body: z.object({
        full_name: staffFields.full_name.optional(),
        phone: staffFields.phone,
        position: staffFields.position.optional(),
        building_id: staffFields.building_id
    }).strict().refine(
        (body) => Object.keys(body).length > 0,
        "Cần cung cấp ít nhất một trường dữ liệu"
    )
}).strict();

export type ListStaffRequest = z.infer<
    typeof listStaffRequestSchema
>;
export type StaffIdRequest = z.infer<
    typeof staffIdRequestSchema
>;
export type CreateStaffRequest = z.infer<
    typeof createStaffRequestSchema
>;
export type UpdateStaffRequest = z.infer<
    typeof updateStaffRequestSchema
>;

