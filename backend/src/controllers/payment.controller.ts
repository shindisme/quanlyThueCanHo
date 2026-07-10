import type {
    Request,
    Response
} from "express";
import { getValidated } from "../middleware/validate.middleware.js";
import type {
    CreatePaymentRequest,
    CreateVnpayPaymentRequest,
    ListPaymentsRequest,
    PaymentIdRequest,
    UpdatePaymentStatusRequest
} from "../schemas/payment.schema.js";
import * as paymentService from "../services/payment.service.js";
import {
    sendPaginated,
    sendSuccess
} from "../utils/api-response.js";

const getClientIp = (request: Request) => {
    const forwardedFor = request.headers["x-forwarded-for"];

    const ip = typeof forwardedFor === "string"
        ? forwardedFor.split(",")[0]?.trim()
        : request.ip || request.socket.remoteAddress;

    if (!ip || ip === "::1") {
        return "127.0.0.1";
    }

    return ip.replace("::ffff:", "");
};

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
        value: paymentService.PAYMENT_METHODS.BANK_TRANSFER,
        label: "Chuyển khoản ngân hàng"
    },
    {
        value: paymentService.PAYMENT_METHODS.E_WALLET,
        label: "Ví điện tử/VNPay"
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
export const createVnpayPayment = async (
    request: Request,
    response: Response
) => {
    const { body } =
        getValidated<CreateVnpayPaymentRequest>(request);

    const result =
        await paymentService.createVnpayPaymentUrlService(
            body,
            request.actor!,
            getClientIp(request)
        );

    return sendSuccess(response, result, 201);
};
export const vnpayReturn = async (
    request: Request,
    response: Response
) => {
    const frontendBaseUrl =
        process.env.FRONTEND_URL || "http://localhost:5173";

    const frontendPaymentPageUrl =
        process.env.FRONTEND_PAYMENT_PAGE_URL
        || `${frontendBaseUrl}/tenant/payments`;

    try {
        const result =
            await paymentService.handleVnpayCallbackService(
                request.query as Record<string, unknown>,
                "RETURN"
            );

        const status = "status" in result
            ? result.status
            : "UNKNOWN";

        const responseCode = "response_code" in result
            ? result.response_code
            : undefined;

        const displayStatus = responseCode === "24"
            ? "CANCELLED"
            : status;

        const invoiceId = "invoice_id" in result
            ? result.invoice_id
            : null;

        const paymentId = "payment_id" in result
            ? result.payment_id
            : null;

        const redirectUrl = new URL(frontendPaymentPageUrl);

        redirectUrl.searchParams.set(
            "payment_status",
            String(displayStatus)
        );

        redirectUrl.searchParams.set(
            "raw_status",
            String(status)
        );

        if (responseCode !== undefined) {
            redirectUrl.searchParams.set(
                "response_code",
                String(responseCode)
            );
        }

        if (invoiceId !== null) {
            redirectUrl.searchParams.set(
                "invoice_id",
                String(invoiceId)
            );
        }

        if (paymentId !== null) {
            redirectUrl.searchParams.set(
                "payment_id",
                String(paymentId)
            );
        }

        return response.redirect(redirectUrl.toString());
    } catch (error) {
        console.error("VNPay return error:", error);

        const redirectUrl = new URL(frontendPaymentPageUrl);

        redirectUrl.searchParams.set(
            "payment_status",
            "PROCESSING"
        );

        redirectUrl.searchParams.set(
            "error",
            "VNPAY_RETURN_ERROR"
        );

        return response.redirect(redirectUrl.toString());
    }
};
export const vnpayIpn = async (
    request: Request,
    response: Response
) => {
    const result =
        await paymentService.handleVnpayCallbackService(
            request.query as Record<string, unknown>,
            "IPN"
        );

    return response.status(200).json(result);
};