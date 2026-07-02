import type {
    Request,
    Response
} from "express";
import { getValidated } from "../middleware/validate.middleware.js";
import type {
    GenerateMonthlyInvoicesRequest,
    InvoiceIdRequest,
    ListInvoicesRequest,
    UpdateInvoiceStatusRequest
} from "../schemas/invoice.schema.js";
import * as invoiceService from "../services/invoice.service.js";
import {
    sendPaginated,
    sendSuccess
} from "../utils/api-response.js";

export const getAll = async (
    request: Request,
    response: Response
) => {
    const { query } = getValidated<ListInvoicesRequest>(request);
    const result = await invoiceService.getInvoicesService(
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
    const { params } = getValidated<InvoiceIdRequest>(request);
    const invoice = await invoiceService.getInvoiceByIdService(
        params.id,
        request.actor!
    );

    return sendSuccess(response, invoice);
};

export const generateMonthly = async (
    request: Request,
    response: Response
) => {
    const { body } =
        getValidated<GenerateMonthlyInvoicesRequest>(request);
    const result =
        await invoiceService.generateMonthlyInvoicesService(
            body,
            request.actor!
        );

    return sendSuccess(response, result, 201);
};

export const updateStatus = async (
    request: Request,
    response: Response
) => {
    const {
        params,
        body
    } = getValidated<UpdateInvoiceStatusRequest>(request);
    const invoice = await invoiceService.updateInvoiceStatusService(
        params.id,
        body.status,
        request.actor!
    );

    return sendSuccess(response, invoice);
};
