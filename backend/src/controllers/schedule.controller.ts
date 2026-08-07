import type {
    Request,
    Response
} from "express";
import { getValidated } from "../middleware/validate.middleware.js";
import type {
    BookViewingRequest,
    ConfirmScheduleRequest,
    CancelScheduleRequest,
    ListSchedulesRequest,
    ScheduleIdRequest,
    ViewingAvailabilityRequest
} from "../schemas/schedule.schema.js";
import * as scheduleService from "../services/schedule.service.js";
import {
    sendPaginated,
    sendSuccess
} from "../utils/api-response.js";

export const bookViewing = async (
    request: Request,
    response: Response
) => {
    const { body } = getValidated<BookViewingRequest>(request);
    const schedule = await scheduleService.bookViewingService(body);
    return sendSuccess(response, schedule, 201);
};

export const getAvailability = async (
    request: Request,
    response: Response
) => {
    const { query } =
        getValidated<ViewingAvailabilityRequest>(request);
    const availability =
        await scheduleService.getViewingAvailabilityService(
            query.apartment_id,
            query.date
        );

    return sendSuccess(response, availability);
};

export const getSchedules = async (
    request: Request,
    response: Response
) => {
    const { query } = getValidated<ListSchedulesRequest>(request);
    const result = await scheduleService.getSchedulesAdminService(
        query,
        request.actor!
    );

    return sendPaginated(
        response,
        result.data,
        result.pagination
    );
};

export const confirmSchedules = async (
    request: Request,
    response: Response
) => {
    const { params } =
        getValidated<ConfirmScheduleRequest>(request);
    const schedule = await scheduleService.confirmScheduleService(
        params.id,
        request.actor!
    );

    return sendSuccess(response, schedule);
};

export const cancelSchedule = async (
    request: Request,
    response: Response
) => {
    const { params, body } = getValidated<CancelScheduleRequest>(request);
    const reason = body?.cancel_reason || body?.reason;
    const result = await scheduleService.cancelScheduleService(
        params.id,
        request.actor!,
        reason
    );

    return sendSuccess(response, result);
};

export const deleteSchedule = async (
    request: Request,
    response: Response
) => {
    const { params } = getValidated<ScheduleIdRequest>(request);
    await scheduleService.deleteScheduleService(
        params.id,
        request.actor!
    );

    return sendSuccess(response, { deleted: true });
};

export const markAttended = async (
    request: Request,
    response: Response
) => {
    const { params } = getValidated<ScheduleIdRequest>(request);
    const schedule = await scheduleService.markAttendedScheduleService(
        params.id,
        request.actor!
    );

    return sendSuccess(response, schedule);
};

export const markAbsent = async (
    request: Request,
    response: Response
) => {
    const { params } = getValidated<ScheduleIdRequest>(request);
    const schedule = await scheduleService.markAbsentScheduleService(
        params.id,
        request.actor!
    );

    return sendSuccess(response, schedule);
};

