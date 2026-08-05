import {
    ContractTerminationStatus,
    ContractTerminationType,
    DepositPolicy
} from "@prisma/client";
import { z } from "zod";
import {
    emptyObjectSchema,
    idParamsSchema,
    optionalEmptyBodySchema,
    positiveIdSchema
} from "./common.schema.js";
import {
    strictDateOnlySchema,
    strictRfc3339DateSchema
} from "./strict-date.schema.js";
import { isNonNegativeDecimal12_2Amount } from "../utils/money.js";

const dateSchema = z.union([
    strictRfc3339DateSchema,
    strictDateOnlySchema.transform(
        (value) => new Date(`${value}T00:00:00.000Z`)
    )
]);

const moneySchema = z.number().finite().refine(
    isNonNegativeDecimal12_2Amount,
    "Số tiền phải không âm, đúng Decimal(12,2)"
);

const damageItemSchema = z.object({
    description: z.string().trim().min(1).max(1000),
    amount: moneySchema,
    note: z.string().trim().max(2000).optional()
}).strict();

const settlementInputSchema = z.object({
    final_rent: moneySchema.optional(),
    final_electricity: moneySchema.optional(),
    final_water: moneySchema.optional(),
    final_service_fee: moneySchema.optional(),
    other_charges: moneySchema.optional()
}).strict();

const inspectionBodySchema = settlementInputSchema.extend({
    final_electricity_old: moneySchema.optional(),
    final_electricity_new: moneySchema.optional(),
    final_water_old: moneySchema.optional(),
    final_water_new: moneySchema.optional(),
    requires_maintenance: z.boolean().default(false),
    deposit_policy: z.nativeEnum(DepositPolicy).optional(),
    inspection_note: z.string().trim().max(5000).optional(),
    damage_items: z.array(damageItemSchema).max(100).default([])
}).strict();

export const listContractTerminationsRequestSchema = z.object({
    params: emptyObjectSchema,
    query: z.object({
        contract_id: positiveIdSchema.optional(),
        status: z.nativeEnum(ContractTerminationStatus).optional(),
        type: z.nativeEnum(ContractTerminationType).optional(),
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(10)
    }).strict(),
    body: optionalEmptyBodySchema
}).strict();

export const createTenantTerminationRequestSchema = z.object({
    params: emptyObjectSchema,
    query: emptyObjectSchema,
    body: z.object({
        contract_id: positiveIdSchema,
        requested_end_date: dateSchema,
        reason: z.string().trim().min(1).max(5000)
    }).strict()
}).strict();

export const createOverdueTerminationRequestSchema = z.object({
    params: emptyObjectSchema,
    query: emptyObjectSchema,
    body: z.object({
        contract_id: positiveIdSchema,
        reason: z.string().trim().min(1).max(5000)
    }).strict()
}).strict();

export const overdueCandidatesRequestSchema = z.object({
    params: emptyObjectSchema,
    query: emptyObjectSchema,
    body: optionalEmptyBodySchema
}).strict();

export const approveTerminationRequestSchema = z.object({
    params: idParamsSchema,
    query: emptyObjectSchema,
    body: z.object({
        effective_end_date: dateSchema.optional()
    }).strict().default({})
}).strict();

export const rejectTerminationRequestSchema = z.object({
    params: idParamsSchema,
    query: emptyObjectSchema,
    body: z.object({
        rejected_reason: z.string().trim().min(1).max(5000)
    }).strict()
}).strict();

export const terminationIdRequestSchema = z.object({
    params: idParamsSchema,
    query: emptyObjectSchema,
    body: optionalEmptyBodySchema
}).strict();

export const updateInspectionRequestSchema = z.object({
    params: idParamsSchema,
    query: emptyObjectSchema,
    body: inspectionBodySchema
}).strict();

export const previewSettlementRequestSchema = z.object({
    params: idParamsSchema,
    query: emptyObjectSchema,
    body: inspectionBodySchema.partial().default({})
}).strict();

export const completeHandoverRequestSchema = z.object({
    params: idParamsSchema,
    query: emptyObjectSchema,
    body: inspectionBodySchema.partial().extend({
        requires_maintenance: z.boolean().default(false)
    }).default({ requires_maintenance: false })
}).strict();

export type ListContractTerminationsRequest = z.infer<
    typeof listContractTerminationsRequestSchema
>;
export type CreateTenantTerminationRequest = z.infer<
    typeof createTenantTerminationRequestSchema
>;
export type CreateOverdueTerminationRequest = z.infer<
    typeof createOverdueTerminationRequestSchema
>;
export type OverdueCandidatesRequest = z.infer<
    typeof overdueCandidatesRequestSchema
>;
export type ApproveTerminationRequest = z.infer<
    typeof approveTerminationRequestSchema
>;
export type RejectTerminationRequest = z.infer<
    typeof rejectTerminationRequestSchema
>;
export type TerminationIdRequest = z.infer<
    typeof terminationIdRequestSchema
>;
export type UpdateInspectionRequest = z.infer<
    typeof updateInspectionRequestSchema
>;
export type PreviewSettlementRequest = z.infer<
    typeof previewSettlementRequestSchema
>;
export type CompleteHandoverRequest = z.infer<
    typeof completeHandoverRequestSchema
>;

