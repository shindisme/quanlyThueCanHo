import type {
    Request,
    Response
} from "express";
import { getValidated } from "../middleware/validate.middleware.js";
import type {
    CreateStaffRequest,
    ListStaffRequest,
    StaffIdRequest,
    UpdateStaffRequest
} from "../schemas/staff.schema.js";
import * as staffService from "../services/staff.service.js";
import {
    sendPaginated,
    sendSuccess
} from "../utils/api-response.js";

export const getAll = async (
    request: Request,
    response: Response
) => {
    const { query } = getValidated<ListStaffRequest>(request);
    const result = await staffService.getAllStaffService(
        query,
        request.actor!
    );

    return sendPaginated(
        response,
        result.data,
        result.pagination
    );
};

export const getById = async (
    request: Request,
    response: Response
) => {
    const { params } = getValidated<StaffIdRequest>(request);
    const staff = await staffService.getStaffByIdService(
        params.id,
        request.actor!
    );

    return sendSuccess(response, staff);
};

export const create = async (
    request: Request,
    response: Response
) => {
    const { body } = getValidated<CreateStaffRequest>(request);
    const staff = await staffService.createStaffService(
        body,
        request.actor!
    );

    return sendSuccess(response, staff, 201);
};

export const update = async (
    request: Request,
    response: Response
) => {
    const {
        params,
        body
    } = getValidated<UpdateStaffRequest>(request);
    const staff = await staffService.updateStaffService(
        params.id,
        body,
        request.actor!
    );

    return sendSuccess(response, staff);
};

export const remove = async (
    request: Request,
    response: Response
) => {
    const { params } = getValidated<StaffIdRequest>(request);
    await staffService.deleteStaffService(
        params.id,
        request.actor!
    );

    return sendSuccess(response, { deleted: true });
};
