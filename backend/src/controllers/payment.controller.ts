import type {
    Request,
    Response
} from "express";
import { getValidated } from "../middleware/validate.middleware.js";
import type {
    CreatePaymentRequest,
    ListPaymentsRequest,
    PaymentIdRequest,
    UpdatePaymentStatusRequest
} from "../schemas/payment.schema.js";
import * as paymentService from "../services/payment.service.js";
import {
    sendPaginated,
    sendSuccess
} from "../utils/api-response.js";

export const getAll = async (
    request: Request,
    response: Response
) => {
    const { query } = getValidated<ListPaymentsRequest>(request);
    const result = await paymentService.getPaymentsService(
        query,
        request.actor!
    );

    return sendPaginated(
        response,
        result.data,
        result.pagination
    );
};

export const getMethods = async (
    _request: Request,
    response: Response
) => sendSuccess(response, [
    {
        value: paymentService.PAYMENT_METHODS.CASH,
        label: "Tien mat"
    },
    {
        value: paymentService.PAYMENT_METHODS.BANK_TRANSFER,
        label: "Chuyen khoan ngan hang"
    },
    {
        value: paymentService.PAYMENT_METHODS.E_WALLET,
        label: "Vi dien tu"
    }
]);

export const getById = async (
    request: Request,
    response: Response
) => {
    const { params } = getValidated<PaymentIdRequest>(request);
    const payment = await paymentService.getPaymentByIdService(
        params.id,
        request.actor!
    );

    return sendSuccess(response, payment);
};

export const create = async (
    request: Request,
    response: Response
) => {
    const { body } = getValidated<CreatePaymentRequest>(request);
    const payment = await paymentService.createPaymentService(
        body,
        request.actor!
    );

    return sendSuccess(response, payment, 201);
};

export const updateStatus = async (
    request: Request,
    response: Response
) => {
    const {
        params,
        body
    } = getValidated<UpdatePaymentStatusRequest>(request);
    const payment = await paymentService.updatePaymentStatusService(
        params.id,
        body.status,
        request.actor!
    );

    return sendSuccess(response, payment);
};
