import type {
    Request,
    Response
} from "express";
import { getValidated } from "../middleware/validate.middleware.js";
import type {
    CompleteMaintenanceRequest,
    ConfirmMaintenanceRequest,
    CreateMaintenanceRequest,
    ListMaintenanceRequest,
    MaintenanceIdRequest,
    UnableMaintenanceRequest
} from "../schemas/maintenance.schema.js";
import * as maintenanceService from "../services/maintenance.service.js";
import {
    sendPaginated,
    sendSuccess
} from "../utils/api-response.js";

export const getAll = async (
    request: Request,
    response: Response
) => {
    const { query } =
        getValidated<ListMaintenanceRequest>(request);
    const result =
        await maintenanceService.getMaintenanceRequestsService(
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
    const { params } =
        getValidated<MaintenanceIdRequest>(request);
    const result =
        await maintenanceService.getMaintenanceRequestByIdService(
            params.id,
            request.actor!
        );

    return sendSuccess(response, result);
};

export const create = async (
    request: Request,
    response: Response
) => {
    const { body } =
        getValidated<CreateMaintenanceRequest>(request);
    const result =
        await maintenanceService.createMaintenanceRequestService(
            body,
            request.actor!
        );

    return sendSuccess(response, result, 201);
};

export const cancel = async (
    request: Request,
    response: Response
) => {
    const { params } =
        getValidated<MaintenanceIdRequest>(request);
    const result =
        await maintenanceService.cancelMaintenanceRequestService(
            params.id,
            request.actor!
        );

    return sendSuccess(response, result);
};

export const confirm = async (
    request: Request,
    response: Response
) => {
    const {
        params,
        body
    } = getValidated<ConfirmMaintenanceRequest>(request);
    const result =
        await maintenanceService.confirmMaintenanceRequestService(
            params.id,
            body,
            request.actor!
        );

    return sendSuccess(response, result);
};

export const unable = async (
    request: Request,
    response: Response
) => {
    const {
        params,
        body
    } = getValidated<UnableMaintenanceRequest>(request);
    const result =
        await maintenanceService.markMaintenanceUnableService(
            params.id,
            body,
            request.actor!
        );

    return sendSuccess(response, result);
};

export const complete = async (
    request: Request,
    response: Response
) => {
    const {
        params,
        body
    } = getValidated<CompleteMaintenanceRequest>(request);
    const result =
        await maintenanceService.completeMaintenanceRequestService(
            params.id,
            body,
            request.actor!
        );

    return sendSuccess(response, result);
};
