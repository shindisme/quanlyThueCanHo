import type {
    Request,
    Response
} from "express";
import { getValidated } from "../middleware/validate.middleware.js";
import type {
    ListNotificationsRequest,
    MarkNotificationReadRequest,
    NotificationIdRequest,
    SendBuildingNotificationRequest,
    SendInvoiceNotificationsRequest
} from "../schemas/notification.schema.js";
import * as notificationService from "../services/notification.service.js";
import {
    sendPaginated,
    sendSuccess
} from "../utils/api-response.js";

export const getAll = async (
    request: Request,
    response: Response
) => {
    const { query } =
        getValidated<ListNotificationsRequest>(request);
    const result =
        await notificationService.getNotificationsService(
            query,
            request.actor!
        );

    return sendPaginated(
        response,
        result.data,
        result.pagination,
        200,
        { unread_count: result.unread_count }
    );
};

export const sendToBuilding = async (
    request: Request,
    response: Response
) => {
    const { body } =
        getValidated<SendBuildingNotificationRequest>(request);
    const result =
        await notificationService.sendBuildingNotificationService(
            body,
            request.actor!
        );

    return sendSuccess(response, result, 201);
};

export const sendInvoices = async (
    request: Request,
    response: Response
) => {
    const { body } =
        getValidated<SendInvoiceNotificationsRequest>(request);
    const result =
        await notificationService.sendInvoiceNotificationsService(
            body,
            request.actor!
        );

    return sendSuccess(response, result, 201);
};

export const markRead = async (
    request: Request,
    response: Response
) => {
    const {
        params,
        body
    } = getValidated<MarkNotificationReadRequest>(request);
    const notification =
        await notificationService.markNotificationReadService(
            params.id,
            request.actor!,
            body.is_read
        );

    return sendSuccess(response, notification);
};

export const markAllRead = async (
    request: Request,
    response: Response
) => {
    const result =
        await notificationService.markAllNotificationsReadService(
            request.actor!
        );

    return sendSuccess(response, result);
};

export const remove = async (
    request: Request,
    response: Response
) => {
    const { params } =
        getValidated<NotificationIdRequest>(request);
    await notificationService.deleteNotificationService(
        params.id,
        request.actor!
    );

    return sendSuccess(response, { deleted: true });
};
