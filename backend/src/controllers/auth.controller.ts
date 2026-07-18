import type {
    Request,
    Response
} from "express";
import { AppError } from "../errors/app-error.js";
import { getValidated } from "../middleware/validate.middleware.js";
import type {
    ActivateAccountRequest,
    ChangePasswordRequest,
    CreateUserRequest,
    LoginRequest,
    UpdateUserRequest,
    UserIdRequest
} from "../schemas/auth.schema.js";
import * as authService from "../services/auth.service.js";
import type { Actor } from "../types/auth.js";
import { sendSuccess } from "../utils/api-response.js";

const getActor = (request: Request): Actor => {
    if (!request.actor) {
        throw new AppError(
            401,
            "AUTHENTICATION_REQUIRED",
            "Yêu cầu đăng nhập"
        );
    }

    return request.actor;
};

export const createAccount = async (request: Request, response: Response) => {
    const { body } = getValidated<CreateUserRequest>(request);
    const result = await authService.createAccountByAdminService(
        getActor(request),
        body
    );

    return sendSuccess(response, result, 201);
};

export const login = async (request: Request, response: Response) => {
    const { username, password } =
        getValidated<LoginRequest>(request).body;
    const result = await authService.loginService(username, password);

    return sendSuccess(response, result);
};

export const activateAccount = async (
    request: Request,
    response: Response
) => {
    const { token } =
        getValidated<ActivateAccountRequest>(request).query;

    await authService.activateTenantAccountService(token);

    return response
        .type("html")
        .send(`
            <!doctype html>
            <html lang="vi">
            <head>
                <meta charset="utf-8">
                <title>Kích hoạt tài khoản</title>
            </head>
            <body style="font-family: Arial, sans-serif; padding: 32px;">
                <h1>Kích hoạt tài khoản thành công</h1>
                <p>Tài khoản của bạn đã được kích hoạt. Bạn có thể quay lại hệ thống để đăng nhập.</p>
            </body>
            </html>
        `);
};
export const logout = async (request: Request, response: Response) => {
    const result = await authService.logoutService(getActor(request));

    return sendSuccess(response, result);
};
export const deleteUser = async (request: Request, response: Response) => {
    const { id } = getValidated<UserIdRequest>(request).params;
    await authService.deleteUserService(getActor(request), id);

    return sendSuccess(response, { deleted: true });
};

export const getAllUsers = async (request: Request, response: Response) => {
    const users = await authService.getAllUsersService(getActor(request));

    return sendSuccess(response, users);
};

export const updateUserInfo = async (
    request: Request,
    response: Response
) => {
    const { params, body } = getValidated<UpdateUserRequest>(request);
    const user = await authService.updateUserService(
        getActor(request),
        params.id,
        body
    );

    return sendSuccess(response, user);
};

export const resetPassword = async (
    request: Request,
    response: Response
) => {
    const { id } = getValidated<UserIdRequest>(request).params;
    const result = await authService.resetPasswordByAdminService(
        getActor(request),
        id
    );

    return sendSuccess(response, result);
};

export const changePassword = async (
    request: Request,
    response: Response
) => {
    const { oldPass, newPass } =
        getValidated<ChangePasswordRequest>(request).body;
    await authService.changePasswordService(
        getActor(request).userId,
        oldPass,
        newPass
    );

    return sendSuccess(response, { changed: true });
};
