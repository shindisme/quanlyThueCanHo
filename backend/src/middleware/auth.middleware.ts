import {
    UserStatus,
    type Role
} from "@prisma/client";
import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../config/database.js";
import { AppError } from "../errors/app-error.js";
import type { Actor } from "../types/auth.js";

const invalidTokenError = () => new AppError(
    401,
    "INVALID_TOKEN",
    "Authentication token is invalid or expired"
);

const getBearerToken = (authorization: string | undefined) => {
    const match = authorization?.match(/^Bearer ([^\s]+)$/);

    if (!match) {
        throw new AppError(
            401,
            "AUTHENTICATION_REQUIRED",
            "Authentication is required"
        );
    }

    return match[1];
};

const getSubjectUserId = (payload: string | jwt.JwtPayload) => {
    if (
        typeof payload === "string"
        || typeof payload.sub !== "string"
        || !/^[1-9]\d*$/.test(payload.sub)
    ) {
        throw invalidTokenError();
    }

    const userId = Number(payload.sub);

    if (!Number.isSafeInteger(userId)) {
        throw invalidTokenError();
    }

    return userId;
};

export const authenticate: RequestHandler = async (request, _response, next) => {
    const token = getBearerToken(request.headers.authorization);
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new AppError(
            500,
            "JWT_NOT_CONFIGURED",
            "JWT authentication is not configured"
        );
    }

    const payload = jwt.verify(token, secret, {
        algorithms: ["HS256"]
    });
    const userId = getSubjectUserId(payload);
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            role: true,
            status: true,
            staff: {
                select: {
                    id: true,
                    building_id: true
                }
            },
            tenant: {
                select: {
                    id: true
                }
            }
        }
    });

    if (!user) {
        throw invalidTokenError();
    }

    if (user.status !== UserStatus.ACTIVE) {
        throw new AppError(
            403,
            "ACCOUNT_DISABLED",
            "This account is disabled"
        );
    }

    const actor: Actor = {
        userId: user.id,
        role: user.role,
        status: user.status
    };

    if (user.staff) {
        actor.staffId = user.staff.id;

        if (user.staff.building_id !== null) {
            actor.buildingId = user.staff.building_id;
        }
    }

    if (user.tenant) {
        actor.tenantId = user.tenant.id;
    }

    request.actor = actor;
    next();
};

export const authorizeRole = (roles: Role[]): RequestHandler => {
    return (request, _response, next) => {
        if (!request.actor) {
            throw new AppError(
                401,
                "AUTHENTICATION_REQUIRED",
                "Authentication is required"
            );
        }

        if (!roles.includes(request.actor.role)) {
            throw new AppError(
                403,
                "FORBIDDEN",
                "You do not have permission to perform this action"
            );
        }

        next();
    };
};
