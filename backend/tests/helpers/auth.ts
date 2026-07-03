import jwt from "jsonwebtoken";

type ExtraClaims = Omit<jwt.JwtPayload, "sub">;

const getTestSecret = () => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured for tests");
    }

    return process.env.JWT_SECRET;
};

export const createBearerToken = (
    userId: number,
    extraClaims: ExtraClaims = {}
) => {
    const token = jwt.sign({
        ...extraClaims,
        sub: String(userId)
    }, getTestSecret(), {
        algorithm: "HS256",
        expiresIn: "1h"
    });

    return `Bearer ${token}`;
};
