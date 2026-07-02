import {
    InvoiceStatus
} from "@prisma/client";
import { z } from "zod";
import {
    isNonNegativeDecimal12_2Amount
} from "../utils/money.js";
import { strictRfc3339DateSchema } from "./strict-date.schema.js";

const emptyObjectSchema = z.object({}).strict();
const optionalEmptyBodySchema = emptyObjectSchema.default({});
const positiveIdSchema = z.coerce.number().int().positive();
const monthSchema = z.coerce.number().int().min(1).max(12);
const yearSchema = z.coerce.number().int().min(2000).max(3000);
const moneySchema = z.number().finite().refine(
    isNonNegativeDecimal12_2Amount,
    "amount must be nonnegative, fit Decimal(12,2), and use at most two decimal places"
);

export const listInvoicesRequestSchema = z.object({
    params: emptyObjectSchema,
    query: z.object({
        status: z.nativeEnum(InvoiceStatus).optional(),
        tenant_id: positiveIdSchema.optional(),
        contract_id: positiveIdSchema.optional(),
        apartment_id: positiveIdSchema.optional(),
        building_id: positiveIdSchema.optional(),
        month: monthSchema.optional(),
        year: yearSchema.optional(),
        search: z.string().trim().min(1).max(200).optional(),
        page: positiveIdSchema.default(1),
        limit: positiveIdSchema.max(100).default(10)
    }).strict().refine(
        (query) => (
            query.month === undefined
            && query.year === undefined
        ) || (
            query.month !== undefined
            && query.year !== undefined
        ),
        {
            message: "month and year must be provided together",
            path: ["month"]
        }
    ),
    body: optionalEmptyBodySchema
}).strict();

export const invoiceIdRequestSchema = z.object({
    params: z.object({
        id: positiveIdSchema
    }).strict(),
    query: emptyObjectSchema,
    body: optionalEmptyBodySchema
}).strict();

export const generateMonthlyInvoicesRequestSchema = z.object({
    params: emptyObjectSchema,
    query: emptyObjectSchema,
    body: z.object({
        month: monthSchema.optional(),
        year: yearSchema.optional(),
        building_id: positiveIdSchema.optional(),
        due_date: strictRfc3339DateSchema.optional(),
        management_fee: moneySchema.optional(),
        management_fee_per_m2: moneySchema.optional(),
        electric_unit_price: moneySchema.optional(),
        water_unit_price: moneySchema.optional(),
        internet_fee: moneySchema.optional(),
        notify: z.boolean().optional()
    }).strict().refine(
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

export const updateInvoiceStatusRequestSchema = z.object({
    params: z.object({
        id: positiveIdSchema
    }).strict(),
    query: emptyObjectSchema,
    body: z.object({
        status: z.nativeEnum(InvoiceStatus)
    }).strict()
}).strict();

export type ListInvoicesRequest = z.infer<
    typeof listInvoicesRequestSchema
>;
export type InvoiceIdRequest = z.infer<
    typeof invoiceIdRequestSchema
>;
export type GenerateMonthlyInvoicesRequest = z.infer<
    typeof generateMonthlyInvoicesRequestSchema
>;
export type UpdateInvoiceStatusRequest = z.infer<
    typeof updateInvoiceStatusRequestSchema
>;
