import { PaymentStatus } from "@prisma/client";
import { z } from "zod";
import { isDecimal12_2Amount } from "../utils/money.js";

const emptyObjectSchema = z.object({}).strict();
const optionalEmptyBodySchema = emptyObjectSchema.default({});
const queryIdSchema = z.coerce.number().int().positive();
const jsonIdSchema = z.number().finite().int().positive();
const paymentMethodSchema = z.string().trim().min(1).max(50);
const paymentAmountSchema = z.number()
    .refine(
        isDecimal12_2Amount,
        "amount must fit Decimal(12,2) and use at most two decimal places"
    );

export const listPaymentsRequestSchema = z.object({
    params: emptyObjectSchema,
    query: z.object({
        status: z.nativeEnum(PaymentStatus).optional(),
        payment_method: paymentMethodSchema.optional(),
        invoice_id: queryIdSchema.optional(),
        tenant_id: queryIdSchema.optional(),
        contract_id: queryIdSchema.optional(),
        building_id: queryIdSchema.optional(),
        search: z.string().trim().min(1).max(200).optional(),
        page: queryIdSchema.default(1),
        limit: queryIdSchema.max(100).default(10)
    }).strict(),
    body: optionalEmptyBodySchema
}).strict();

export const paymentIdRequestSchema = z.object({
    params: z.object({
        id: queryIdSchema
    }).strict(),
    query: emptyObjectSchema,
    body: optionalEmptyBodySchema
}).strict();

export const createPaymentRequestSchema = z.object({
    params: emptyObjectSchema,
    query: emptyObjectSchema,
    body: z.object({
        invoice_id: jsonIdSchema,
        payment_method: paymentMethodSchema,
        transaction_code:
            z.string().trim().min(1).max(200).optional(),
        amount: paymentAmountSchema.optional(),
        status: z.nativeEnum(PaymentStatus).optional()
    }).strict()
}).strict();

export const createVnpayPaymentRequestSchema = z.object({
    params: emptyObjectSchema,
    query: emptyObjectSchema,
    body: z.object({
        invoice_id: jsonIdSchema,
        bank_code: z.string().trim().max(20).optional()
    }).strict()
}).strict();

export const updatePaymentStatusRequestSchema = z.object({
    params: z.object({
        id: queryIdSchema
    }).strict(),
    query: emptyObjectSchema,
    body: z.object({
        status: z.nativeEnum(PaymentStatus)
    }).strict()
}).strict();

export const paymentMethodsRequestSchema = z.object({
    params: emptyObjectSchema,
    query: emptyObjectSchema,
    body: optionalEmptyBodySchema
}).strict();

export type ListPaymentsRequest = z.infer<
    typeof listPaymentsRequestSchema
>;
export type PaymentIdRequest = z.infer<
    typeof paymentIdRequestSchema
>;
export type CreatePaymentRequest = z.infer<
    typeof createPaymentRequestSchema
>;
export type UpdatePaymentStatusRequest = z.infer<
    typeof updatePaymentStatusRequestSchema
>;

export type CreateVnpayPaymentRequest = z.infer<
    typeof createVnpayPaymentRequestSchema
>;
