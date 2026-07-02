import { ContractStatus } from "@prisma/client";
import { z } from "zod";
import {
    isPositiveDecimal12_2Amount
} from "../utils/money.js";

const emptyObjectSchema = z.object({}).strict();
const optionalEmptyBodySchema = emptyObjectSchema.default({});
const positiveIdSchema = z.coerce.number().int().positive();
const positiveAmountSchema = z.number().finite().refine(
    isPositiveDecimal12_2Amount,
    "amount must be positive, fit Decimal(12,2), and use at most two decimal places"
);

const isCalendarDate = (
    yearText: string,
    monthText: string,
    dayText: string
) => {
    const date = new Date(
        `${yearText}-${monthText}-${dayText}T00:00:00.000Z`
    );

    return !Number.isNaN(date.getTime())
        && date.getUTCFullYear() === Number(yearText)
        && date.getUTCMonth() + 1 === Number(monthText)
        && date.getUTCDate() === Number(dayText);
};

const parseStrictDate = (value: string) => {
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

    if (dateOnly) {
        if (!isCalendarDate(dateOnly[1], dateOnly[2], dateOnly[3])) {
            return null;
        }

        return new Date(`${value}T00:00:00.000Z`);
    }

    const timestamp = /^(\d{4})-(\d{2})-(\d{2})[Tt](\d{2}):(\d{2}):(\d{2})(\.\d+)?([Zz]|[+-](\d{2}):(\d{2}))$/.exec(
        value
    );

    if (
        !timestamp
        || !isCalendarDate(timestamp[1], timestamp[2], timestamp[3])
        || Number(timestamp[4]) > 23
        || Number(timestamp[5]) > 59
        || Number(timestamp[6]) > 59
        || timestamp[9] !== undefined
        && Number(timestamp[9]) > 23
        || timestamp[10] !== undefined
        && Number(timestamp[10]) > 59
    ) {
        return null;
    }

    const normalized = [
        `${timestamp[1]}-${timestamp[2]}-${timestamp[3]}`,
        "T",
        `${timestamp[4]}:${timestamp[5]}:${timestamp[6]}`,
        timestamp[7] ?? "",
        timestamp[8].toUpperCase()
    ].join("");
    const date = new Date(normalized);

    return Number.isNaN(date.getTime()) ? null : date;
};

const strictDateSchema = z.string().trim().transform(
    (value, context) => {
        const date = parseStrictDate(value);

        if (!date) {
            context.addIssue({
                code: "custom",
                message: "Invalid date"
            });
            return z.NEVER;
        }

        return date;
    }
);

const contractBodySchema = z.object({
    apartment_id: positiveIdSchema,
    tenant_id: positiveIdSchema,
    start_date: strictDateSchema,
    end_date: strictDateSchema,
    deposit_amount: positiveAmountSchema,
    monthly_rent: positiveAmountSchema,
    signed_at: strictDateSchema,
    contract_file: z.string().trim().min(1).max(2000)
        .nullable().optional()
}).strict().superRefine((body, context) => {
    if (body.end_date <= body.start_date) {
        context.addIssue({
            code: "custom",
            path: ["end_date"],
            message: "end_date must be later than start_date"
        });
    }
});

export const createContractRequestSchema = z.object({
    params: emptyObjectSchema,
    query: emptyObjectSchema,
    body: contractBodySchema
}).strict();

export const listContractsRequestSchema = z.object({
    params: emptyObjectSchema,
    query: z.object({
        status: z.nativeEnum(ContractStatus).optional(),
        tenant_id: positiveIdSchema.optional(),
        apartment_id: positiveIdSchema.optional(),
        building_id: positiveIdSchema.optional(),
        search: z.string().trim().min(1).max(200).optional(),
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(10)
    }).strict(),
    body: optionalEmptyBodySchema
}).strict();

export const contractIdRequestSchema = z.object({
    params: z.object({
        id: positiveIdSchema
    }).strict(),
    query: emptyObjectSchema,
    body: optionalEmptyBodySchema
}).strict();

export const extendContractRequestSchema = z.object({
    params: z.object({
        id: positiveIdSchema
    }).strict(),
    query: emptyObjectSchema,
    body: z.object({
        new_end_date: strictDateSchema
    }).strict()
}).strict();

export const endContractRequestSchema = z.object({
    params: z.object({
        id: positiveIdSchema
    }).strict(),
    query: emptyObjectSchema,
    body: z.object({
        end_date: strictDateSchema.optional()
    }).strict().default({})
}).strict();

export type CreateContractRequest = z.infer<
    typeof createContractRequestSchema
>;
export type ListContractsRequest = z.infer<
    typeof listContractsRequestSchema
>;
export type ContractIdRequest = z.infer<
    typeof contractIdRequestSchema
>;
export type ExtendContractRequest = z.infer<
    typeof extendContractRequestSchema
>;
export type EndContractRequest = z.infer<
    typeof endContractRequestSchema
>;
