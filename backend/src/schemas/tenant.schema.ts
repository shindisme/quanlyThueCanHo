import { z } from "zod";

const emptyObjectSchema = z.object({}).strict();
const optionalEmptyBodySchema = emptyObjectSchema.default({});
const positiveIdSchema = z.coerce.number().int().positive();

const dateOnlySchema = z.string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((value) => {
        const [year, month, day] = value.split("-").map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));

        return date.getUTCFullYear() === year
            && date.getUTCMonth() === month - 1
            && date.getUTCDate() === day;
    }, "Invalid calendar date")
    .transform((value) => new Date(`${value}T00:00:00.000Z`));

const tenantFields = {
    full_name: z.string().trim().min(1).max(200),
    phone: z.string()
        .trim()
        .regex(/^\+?\d{9,15}$/)
        .nullable()
        .optional(),
    email: z.string().trim().email().max(320).nullable().optional(),
    date_of_birth: dateOnlySchema.nullable().optional(),
    citizen_id: z.string().trim().regex(/^\d{12}$/),
    address: z.string().trim().max(500).nullable().optional(),
    is_verified: z.boolean().optional(),
    onboarding_building_id: positiveIdSchema.nullable().optional()
};

const nullablePhoneSchema = z.union([
    z.string().trim().regex(/^0[1-9]\d{8}$/),
    z.literal("")
])
    .nullable()
    .optional()
    .transform((value) => value === "" ? null : value);

const occupantFields = {
    full_name: z.string().trim().min(1).max(200),
    phone: nullablePhoneSchema,
    citizen_id: z.string().trim().regex(/^\d{12}$/),
    date_of_birth: dateOnlySchema.nullable().optional()
};

export const createTenantRequestSchema = z.object({
    params: emptyObjectSchema,
    query: emptyObjectSchema,
    body: z.object(tenantFields).strict()
}).strict();

export const listTenantsRequestSchema = z.object({
    params: emptyObjectSchema,
    query: z.object({
        search: z.string().trim().min(1).max(200).optional(),
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(10)
    }).strict(),
    body: optionalEmptyBodySchema
}).strict();

export const tenantIdRequestSchema = z.object({
    params: z.object({
        id: positiveIdSchema
    }).strict(),
    query: emptyObjectSchema,
    body: optionalEmptyBodySchema
}).strict();

export const updateTenantRequestSchema = z.object({
    params: z.object({
        id: positiveIdSchema
    }).strict(),
    query: emptyObjectSchema,
    body: z.object({
        full_name: tenantFields.full_name.optional(),
        phone: tenantFields.phone,
        email: tenantFields.email,
        date_of_birth: tenantFields.date_of_birth,
        citizen_id: tenantFields.citizen_id.optional(),
        address: tenantFields.address,
        is_verified: tenantFields.is_verified,
        onboarding_building_id:
            tenantFields.onboarding_building_id
    }).strict().refine(
        (body) => Object.keys(body).length > 0,
        "At least one field must be provided"
    )
}).strict();

export const listMyOccupantsRequestSchema = z.object({
    params: emptyObjectSchema,
    query: emptyObjectSchema,
    body: optionalEmptyBodySchema
}).strict();

export const createOccupantRequestSchema = z.object({
    params: emptyObjectSchema,
    query: emptyObjectSchema,
    body: z.object(occupantFields).strict()
}).strict();

export const occupantIdRequestSchema = z.object({
    params: z.object({
        occupantId: positiveIdSchema
    }).strict(),
    query: emptyObjectSchema,
    body: optionalEmptyBodySchema
}).strict();

export const updateOccupantRequestSchema = z.object({
    params: z.object({
        occupantId: positiveIdSchema
    }).strict(),
    query: emptyObjectSchema,
    body: z.object({
        full_name: occupantFields.full_name.optional(),
        phone: occupantFields.phone,
        citizen_id: occupantFields.citizen_id.optional(),
        date_of_birth: occupantFields.date_of_birth
    }).strict().refine(
        (body) => Object.keys(body).length > 0,
        "At least one field must be provided"
    )
}).strict();

export type CreateTenantRequest = z.infer<
    typeof createTenantRequestSchema
>;
export type ListTenantsRequest = z.infer<
    typeof listTenantsRequestSchema
>;
export type TenantIdRequest = z.infer<
    typeof tenantIdRequestSchema
>;
export type UpdateTenantRequest = z.infer<
    typeof updateTenantRequestSchema
>;
export type ListMyOccupantsRequest = z.infer<
    typeof listMyOccupantsRequestSchema
>;
export type CreateOccupantRequest = z.infer<
    typeof createOccupantRequestSchema
>;
export type OccupantIdRequest = z.infer<
    typeof occupantIdRequestSchema
>;
export type UpdateOccupantRequest = z.infer<
    typeof updateOccupantRequestSchema
>;