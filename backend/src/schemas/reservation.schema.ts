import { ReservationStatus } from "@prisma/client";
import { z } from "zod";
import {
    emptyObjectSchema,
    idParamsSchema,
    optionalEmptyBodySchema,
    positiveIdSchema
} from "./common.schema.js";
import { isPositiveDecimal12_2Amount } from "../utils/money.js";

const depositAmountSchema = z.number().finite().refine(
    isPositiveDecimal12_2Amount,
    "Số tiền cọc phải là số dương, nằm trong Decimal(12,2) và có tối đa 2 chữ số thập phân"
);

const dateOnlySchema = z.string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((value) => {
        const [year, month, day] = value.split("-").map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));

        return date.getUTCFullYear() === year
            && date.getUTCMonth() === month - 1
            && date.getUTCDate() === day;
    }, "Ngày không hợp lệ")
    .transform((value) => new Date(`${value}T00:00:00.000Z`));

const tenantSchema = z.object({
    full_name: z.string().trim().min(1).max(200),
    phone: z.string()
        .trim()
        .regex(/^\+?\d{9,15}$/)
        .nullable()
        .optional(),
    email: z.string().trim().email().max(320),
    date_of_birth: dateOnlySchema.nullable().optional(),
    citizen_id: z.string().trim().regex(/^\d{12}$/),
    address: z.string().trim().max(500).nullable().optional()
}).strict();

const reservationDepositBaseSchema = z.object({
    apartment_id: positiveIdSchema,
    deposit_amount: depositAmountSchema,
    payment_method: z.enum(["VNPAY", "CASH"]).default("VNPAY").optional(),
    move_in_date: dateOnlySchema
});

const existingTenantReservationSchema = reservationDepositBaseSchema.extend({
    tenant_id: positiveIdSchema,
    tenant: z.never().optional()
}).strict();

const newTenantReservationSchema = reservationDepositBaseSchema.extend({
    tenant: tenantSchema,
    tenant_id: z.never().optional()
}).strict();

export const createReservationRequestSchema = z.object({
    params: emptyObjectSchema,
    query: emptyObjectSchema,
    body: z.union([
        existingTenantReservationSchema,
        newTenantReservationSchema
    ])
}).strict();

export const listReservationsRequestSchema = z.object({
    params: emptyObjectSchema,
    query: z.object({
        status: z.nativeEnum(ReservationStatus).optional(),
        tenant_id: positiveIdSchema.optional(),
        apartment_id: positiveIdSchema.optional(),
        page: positiveIdSchema.default(1),
        limit: positiveIdSchema.max(100).default(10)
    }).strict(),
    body: optionalEmptyBodySchema
}).strict();

export const reservationIdRequestSchema = z.object({
    params: idParamsSchema,
    query: emptyObjectSchema,
    body: optionalEmptyBodySchema
}).strict();

export const expireReservationsRequestSchema = z.object({
    params: emptyObjectSchema,
    query: emptyObjectSchema,
    body: optionalEmptyBodySchema
}).strict();

export type CreateReservationRequest = z.infer<
    typeof createReservationRequestSchema
>;
export type ListReservationsRequest = z.infer<
    typeof listReservationsRequestSchema
>;
export type ReservationIdRequest = z.infer<
    typeof reservationIdRequestSchema
>;