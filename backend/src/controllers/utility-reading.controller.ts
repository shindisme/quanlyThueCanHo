import {
    Role
} from "@prisma/client";
import type {
    Request,
    Response
} from "express";
import { AppError } from "../errors/app-error.js";
import { getValidated } from "../middleware/validate.middleware.js";
import type {
    CreateUtilityReadingRequest,
    ListUtilityReadingsRequest,
    UpdateUtilityReadingRequest,
    UtilityReadingIdRequest
} from "../schemas/utility-reading.schema.js";
import * as utilityReadingService from "../services/utility-reading.service.js";
import {
    sendPaginated,
    sendSuccess
} from "../utils/api-response.js";

const assertRecordedByIsServerControlled = (
    request: Request,
    recordedBy: number | undefined
) => {
    if (
        request.actor!.role !== Role.ADMIN
        && recordedBy !== undefined
    ) {
        throw new AppError(
            400,
            "VALIDATION_ERROR",
            "recorded_by is derived from the authenticated actor"
        );
    }
};

export const create = async (
    request: Request,
    response: Response
) => {
    const { body } =
        getValidated<CreateUtilityReadingRequest>(request);
    assertRecordedByIsServerControlled(request, body.recorded_by);
    const reading =
        await utilityReadingService.createUtilityReadingService(
            body,
            request.actor!
        );

    return sendSuccess(response, reading, 201);
};

export const getAll = async (
    request: Request,
    response: Response
) => {
    const { query } =
        getValidated<ListUtilityReadingsRequest>(request);
    const result =
        await utilityReadingService.getUtilityReadingsService(
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
        getValidated<UtilityReadingIdRequest>(request);
    const reading =
        await utilityReadingService.getUtilityReadingByIdService(
            params.id,
            request.actor!
        );

    return sendSuccess(response, reading);
};

export const update = async (
    request: Request,
    response: Response
) => {
    const {
        params,
        body
    } = getValidated<UpdateUtilityReadingRequest>(request);
    assertRecordedByIsServerControlled(request, body.recorded_by);
    const reading =
        await utilityReadingService.updateUtilityReadingService(
            params.id,
            body,
            request.actor!
        );

    return sendSuccess(response, reading);
};

export const remove = async (
    request: Request,
    response: Response
) => {
    const { params } =
        getValidated<UtilityReadingIdRequest>(request);
    await utilityReadingService.deleteUtilityReadingService(
        params.id,
        request.actor!
    );

    return sendSuccess(response, { deleted: true });
};
