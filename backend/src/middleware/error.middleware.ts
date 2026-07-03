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

export const notFound: RequestHandler = (request, _response, next) => {
    next(new AppError(
        404,
        "NOT_FOUND",
        `Route ${request.method} ${request.originalUrl} was not found`
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
            "Request body contains malformed JSON"
        );
        return;
    }

    if (error instanceof ZodError) {
        sendError(
            response,
            400,
            "VALIDATION_ERROR",
            "Request validation failed",
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
            "Authentication token is invalid or expired"
        );
        return;
    }

    if (error instanceof multer.MulterError) {
        sendError(
            response,
            400,
            "UPLOAD_ERROR",
            "File upload failed",
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
                "A record with the same unique value already exists"
            );
            return;
        }

        if (error.code === "P2003") {
            sendError(
                response,
                409,
                "RELATION_CONFLICT",
                "The operation conflicts with a related record"
            );
            return;
        }

        if (error.code === "P2025") {
            sendError(
                response,
                404,
                "NOT_FOUND",
                "The requested record was not found"
            );
            return;
        }
    }

    console.error("Unhandled error:", error);
    sendError(
        response,
        500,
        "INTERNAL_ERROR",
        "An unexpected error occurred"
    );
};
