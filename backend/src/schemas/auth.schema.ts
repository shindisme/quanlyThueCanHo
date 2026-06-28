import { Role } from "@prisma/client";
import { z } from "zod";

const emptyObjectSchema = z.object({}).strict();
const optionalEmptyBodySchema = emptyObjectSchema.default({});
const positiveIdParamsSchema = z.object({
    id: z.coerce.number().int().positive()
}).strict();

export const emptyAuthRequestSchema = z.object({
    params: emptyObjectSchema,
    query: emptyObjectSchema,
    body: optionalEmptyBodySchema
}).strict();

export const loginRequestSchema = z.object({
    params: emptyObjectSchema,
    query: emptyObjectSchema,
    body: z.object({
        username: z.string().trim().min(1).max(100),
        password: z.string().min(1).max(200)
    }).strict()
}).strict();

export const changePasswordRequestSchema = z.object({
    params: emptyObjectSchema,
    query: emptyObjectSchema,
    body: z.object({
        oldPass: z.string().min(1).max(200),
        newPass: z.string().min(6).max(200)
    }).strict()
}).strict();

export const userIdRequestSchema = z.object({
    params: positiveIdParamsSchema,
    query: emptyObjectSchema,
    body: optionalEmptyBodySchema
}).strict();

export const createUserRequestSchema = z.object({
    params: emptyObjectSchema,
    query: emptyObjectSchema,
    body: z.object({
        username: z.string().trim().min(3).max(100),
        role: z.nativeEnum(Role)
    }).strict()
}).strict();

export const updateUserRequestSchema = z.object({
    params: positiveIdParamsSchema,
    query: emptyObjectSchema,
    body: z.object({
        username: z.string().trim().min(3).max(100).optional(),
        role: z.nativeEnum(Role).optional()
    })
        .strict()
        .refine(
            (body) => body.username !== undefined || body.role !== undefined,
            { message: "At least one field must be provided" }
        )
}).strict();

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type ChangePasswordRequest = z.infer<
    typeof changePasswordRequestSchema
>;
export type UserIdRequest = z.infer<typeof userIdRequestSchema>;
export type CreateUserRequest = z.infer<typeof createUserRequestSchema>;
export type UpdateUserRequest = z.infer<typeof updateUserRequestSchema>;
