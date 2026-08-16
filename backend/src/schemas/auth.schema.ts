import {
    Role,
    UserStatus
} from "@prisma/client";
import { z } from "zod";
import {
    emptyObjectSchema,
    idParamsSchema,
    optionalEmptyBodySchema
} from "./common.schema.js";

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

export const activateAccountRequestSchema = z.object({
    params: emptyObjectSchema,
    query: z.object({
        token: z.string().trim().min(1)
    }).strict(),
    body: optionalEmptyBodySchema
}).strict();

export const changePasswordRequestSchema = z.object({
    params: emptyObjectSchema,
    query: emptyObjectSchema,
    body: z.object({
        oldPass: z.string().min(1).max(200),
        newPass: z.string().min(6).max(200)
    }).strict().refine(
        (body) => body.oldPass !== body.newPass,
        {
            path: ["newPass"],
            message: "Mật khẩu mới phải khác mật khẩu hiện tại"
        }
    )
}).strict();

export const userIdRequestSchema = z.object({
    params: idParamsSchema,
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
    params: idParamsSchema,
    query: emptyObjectSchema,
    body: z.object({
        username: z.string().trim().min(3).max(100).optional(),
        role: z.nativeEnum(Role).optional(),
        status: z.nativeEnum(UserStatus).optional()
    })
        .strict()
        .refine(
            (body) =>
                body.username !== undefined
                || body.role !== undefined
                || body.status !== undefined,
            { message: "Cần cung cấp ít nhất một trường dữ liệu" }
        )
}).strict();

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type ActivateAccountRequest = z.infer<
    typeof activateAccountRequestSchema
>;
export type ChangePasswordRequest = z.infer<
    typeof changePasswordRequestSchema
>;
export type UserIdRequest = z.infer<typeof userIdRequestSchema>;
export type CreateUserRequest = z.infer<typeof createUserRequestSchema>;
export type UpdateUserRequest = z.infer<typeof updateUserRequestSchema>;

