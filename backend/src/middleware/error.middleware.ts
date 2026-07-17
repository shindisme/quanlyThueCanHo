import { Prisma } from "@prisma/client";
import type {
    ErrorRequestHandler,
    RequestHandler,
    Response
} from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import { ZodError } from "zod";
import { AppError } from "../errors/app-error.js";

type ErrorBody = {
    success: false;
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
};

type JsonParseError = SyntaxError & {
    status: 400;
    type: "entity.parse.failed";
    body: string;
};

const isJsonParseError = (error: unknown): error is JsonParseError =>
    error instanceof SyntaxError
    && "status" in error
    && error.status === 400
    && "type" in error
    && error.type === "entity.parse.failed"
    && "body" in error
    && typeof error.body === "string";

const sendError = (
    response: Response,
    statusCode: number,
    code: string,
    message: string,
    details?: unknown
) => {
    const body: ErrorBody = {
        success: false,
        error: {
            code,
            message
        }
    };

    if (details !== undefined) {
        body.error.details = details;
    }

    response.status(statusCode).json(body);
};

const stringifyPrismaMetaValue = (value: unknown) => {
    if (Array.isArray(value)) {
        return value.join(" ");
    }

    return typeof value === "string" ? value : "";
};

const getPrismaMetaText = (
    error: Prisma.PrismaClientKnownRequestError
) => [
    stringifyPrismaMetaValue(error.meta?.field_name),
    stringifyPrismaMetaValue(error.meta?.target),
    stringifyPrismaMetaValue(error.meta?.constraint)
].join(" ").toLowerCase();

const getRelationConflictMessage = (
    error: Prisma.PrismaClientKnownRequestError
) => {
    const metaText = getPrismaMetaText(error);

    if (metaText.includes("building")) {
        return "Không thể thực hiện thao tác vì tòa nhà còn căn hộ hoặc dữ liệu liên quan";
    }

    if (metaText.includes("apartment")) {
        return "Không thể thực hiện thao tác vì căn hộ còn hợp đồng hoặc dữ liệu liên quan";
    }

    if (metaText.includes("tenant")) {
        return "Không thể thực hiện thao tác vì khách thuê còn hợp đồng hoặc dữ liệu liên quan";
    }

    if (metaText.includes("invoice")) {
        return "Không thể thực hiện thao tác vì hóa đơn còn thanh toán hoặc dữ liệu liên quan";
    }

    return "Không thể thực hiện thao tác vì còn dữ liệu liên quan";
};
export const notFound: RequestHandler = (request, _response, next) => {
    next(new AppError(
        404,
        "NOT_FOUND",
        `Không tìm thấy route ${request.method} ${request.originalUrl}`
    ));
};

export const errorHandler: ErrorRequestHandler = (
    error: unknown,
    _request,
    response,
    next
) => {
    if (response.headersSent) {
        next(error);
        return;
    }

    if (isJsonParseError(error)) {
        sendError(
            response,
            400,
            "MALFORMED_JSON",
            "Nội dung JSON của yêu cầu không hợp lệ"
        );
        return;
    }

    if (error instanceof ZodError) {
        sendError(
            response,
            400,
            "VALIDATION_ERROR",
            "Dữ liệu yêu cầu không hợp lệ",
            error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message
            }))
        );
        return;
    }

    if (error instanceof AppError) {
        sendError(
            response,
            error.statusCode,
            error.code,
            error.message,
            error.details
        );
        return;
    }

    if (
        error instanceof jwt.JsonWebTokenError
        || error instanceof jwt.TokenExpiredError
        || error instanceof jwt.NotBeforeError
    ) {
        sendError(
            response,
            401,
            "INVALID_TOKEN",
            "Phiên đăng nhập không hợp lệ hoặc đã hết hạn"
        );
        return;
    }

    if (error instanceof multer.MulterError) {
        sendError(
            response,
            400,
            "UPLOAD_ERROR",
            "Tải tệp lên thất bại",
            {
                code: error.code,
                field: error.field
            }
        );
        return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
            sendError(
                response,
                409,
                "UNIQUE_CONFLICT",
                "Dữ liệu đã tồn tại, vui lòng kiểm tra lại thông tin duy nhất"
            );
            return;
        }

        if (error.code === "P2003") {
            sendError(
                response,
                409,
                "RELATION_CONFLICT",
                getRelationConflictMessage(error)
            );
            return;
        }

        if (error.code === "P2025") {
            sendError(
                response,
                404,
                "NOT_FOUND",
                "Không tìm thấy dữ liệu được yêu cầu"
            );
            return;
        }
    }

    console.error("Lỗi chưa xử lý:", error);
    sendError(
        response,
        500,
        "INTERNAL_ERROR",
        "Đã xảy ra lỗi hệ thống"
    );
};

