import type {
    Request,
    Response
} from "express";
import { AppError } from "../errors/app-error.js";
import { getValidated } from "../middleware/validate.middleware.js";
import type {
    ChangePasswordRequest,
    CreateUserRequest,
    LoginRequest,
    UpdateUserRequest,
    UserIdRequest
} from "../schemas/auth.schema.js";
import * as authService from "../services/auth.service.js";
import { sendSuccess } from "../utils/api-response.js";

export const createAccount = async (request: Request, response: Response) => {
    const { body } = getValidated<CreateUserRequest>(request);
    const user = await authService.createAccountByAdminService(body);

    return sendSuccess(response, { userId: user.id }, 201);
};

export const login = async (request: Request, response: Response) => {
    const { username, password } =
        getValidated<LoginRequest>(request).body;
    const result = await authService.loginService(username, password);

    return sendSuccess(response, result);
};

export const deleteUser = async (request: Request, response: Response) => {
    const { id } = getValidated<UserIdRequest>(request).params;
    await authService.deleteUserService(id);

    return sendSuccess(response, { deleted: true });
};

export const getAllUsers = async (_request: Request, response: Response) => {
    const users = await authService.getAllUsersService();

    return sendSuccess(response, users);
};

export const updateUserInfo = async (
    request: Request,
    response: Response
) => {
    const { params, body } = getValidated<UpdateUserRequest>(request);
    const user = await authService.updateUserService(params.id, body);

    return sendSuccess(response, user);
};

export const resetPassword = async (
    request: Request,
    response: Response
) => {
    const { id } = getValidated<UserIdRequest>(request).params;
    await authService.resetPasswordByAdminService(id);

    return sendSuccess(response, { reset: true });
};

export const changePassword = async (
    request: Request,
    response: Response
) => {
    if (!request.actor) {
        throw new AppError(
            401,
            "AUTHENTICATION_REQUIRED",
            "Authentication is required"
        );
    }

    const { oldPass, newPass } =
        getValidated<ChangePasswordRequest>(request).body;
    await authService.changePasswordService(
        request.actor.userId,
        oldPass,
        newPass
    );

    return sendSuccess(response, { changed: true });
};
