import type {
    Request,
    Response
} from "express";
import { getValidated } from "../middleware/validate.middleware.js";
import type {
    CreateReservationRequest,
    ListReservationsRequest
} from "../schemas/reservation.schema.js";
import * as reservationService from "../services/reservation.service.js";
import {
    sendPaginated,
    sendSuccess
} from "../utils/api-response.js";

export const getAll = async (
    request: Request,
    response: Response
) => {
    const { query } =
        getValidated<ListReservationsRequest>(request);
    const result =
        await reservationService.getReservationsService(
            query,
            request.actor!
        );

    return sendPaginated(
        response,
        result.data,
        result.pagination
    );
};
export const create = async (
    request: Request,
    response: Response
) => {
    const { body } =
        getValidated<CreateReservationRequest>(request);
    const result =
        await reservationService.createReservationDepositService(
            body,
            request.actor!
        );

    return sendSuccess(response, result, 201);
};

export const expire = async (
    request: Request,
    response: Response
) => {
    const result =
        await reservationService.expireReservationsService(
            request.actor!
        );

    return sendSuccess(response, result);
};