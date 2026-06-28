import jwt from "jsonwebtoken";
import type { Actor } from "../../src/types/auth.js";

const getTestSecret = () => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured for tests");
    }

    return process.env.JWT_SECRET;
};

export const createBearerToken = (actor: Actor) => {
    const token = jwt.sign(actor, getTestSecret(), {
        algorithm: "HS256",
        expiresIn: "1h"
    });

    return `Bearer ${token}`;
};
