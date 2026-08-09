import { AppError } from "../errors/app-error.js";

export type NodeEnv = "development" | "test" | "production";

type AppSecurityConfig = {
    corsAllowedOrigins: readonly string[];
    jsonBodyLimit: string;
    trustProxy: boolean;
};

type AppConfig = {
    nodeEnv: NodeEnv;
    port: number;
    auth: {
        jwtSecret: string;
    };
    security: AppSecurityConfig;
};

const LOCALHOST_ORIGIN =
    /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/;

const readEnv = (key: string) => {
    const value = process.env[key]?.trim();

    return value === "" ? undefined : value;
};

const requiredEnv = (
    key: string,
    featureName: string
) => {
    const value = readEnv(key);

    if (value === undefined) {
        throw new AppError(
            500,
            "CONFIG_REQUIRED",
            `Thiếu biến môi trường ${key} cho ${featureName}`
        );
    }

    return value;
};

const parseNodeEnv = (): NodeEnv => {
    const value = readEnv("NODE_ENV") ?? "development";

    if (
        value === "development"
        || value === "test"
        || value === "production"
    ) {
        return value;
    }

    throw new AppError(
        500,
        "CONFIG_INVALID",
        "NODE_ENV phải là development, test hoặc production"
    );
};

const parsePort = () => {
    const value = readEnv("PORT");

    if (value === undefined) {
        return 3000;
    }

    if (!/^\d+$/.test(value)) {
        throw new AppError(
            500,
            "CONFIG_INVALID",
            "PORT phải là số nguyên từ 0 đến 65535"
        );
    }

    const port = Number(value);

    if (!Number.isInteger(port) || port > 65_535) {
        throw new AppError(
            500,
            "CONFIG_INVALID",
            "PORT phải là số nguyên từ 0 đến 65535"
        );
    }

    return port;
};

const parseBoolean = (
    key: string,
    fallback: boolean
) => {
    const value = readEnv(key);

    if (value === undefined) {
        return fallback;
    }

    if (["1", "true", "yes"].includes(value.toLowerCase())) {
        return true;
    }

    if (["0", "false", "no"].includes(value.toLowerCase())) {
        return false;
    }

    throw new AppError(
        500,
        "CONFIG_INVALID",
        `${key} phải là true hoặc false`
    );
};

const originFromUrl = (value: string | undefined) => {
    if (value === undefined) {
        return undefined;
    }

    try {
        return new URL(value).origin;
    } catch {
        throw new AppError(
            500,
            "CONFIG_INVALID",
            "URL cấu hình CORS không hợp lệ"
        );
    }
};

const csvValues = (key: string) =>
    (readEnv(key) ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter((value) => value.length > 0);

const getConfiguredCorsOrigins = () => {
    const origins = new Set<string>();

    for (const value of csvValues("CORS_ORIGINS")) {
        origins.add(originFromUrl(value) ?? value);
    }

    for (const key of [
        "FRONTEND_URL",
        "FRONTEND_PAYMENT_PAGE_URL",
        "FRONTEND_PAYMENT_RESULT_URL"
    ]) {
        const origin = originFromUrl(readEnv(key));

        if (origin !== undefined) {
            origins.add(origin);
        }
    }

    return [...origins];
};

export const getAuthConfig = () => ({
    jwtSecret: requiredEnv("JWT_SECRET", "auth")
});

export const getTenantActivationConfig = () => ({
    jwtSecret: readEnv("TENANT_ACTIVATION_JWT_SECRET")
        ?? `${getAuthConfig().jwtSecret}:tenant-account-activation`
});

export const getBackendBaseUrl = () => (
    readEnv("BACKEND_URL")
    ?? `http://localhost:${parsePort()}`
).replace(/\/$/, "");

export const getCronConfig = () => ({
    secret: requiredEnv("CRON_SECRET", "cron")
});

export const getImageKitConfig = () => ({
    publicKey: requiredEnv("IMAGEKIT_PUBLIC_KEY", "ImageKit"),
    privateKey: requiredEnv("IMAGEKIT_PRIVATE_KEY", "ImageKit"),
    urlEndpoint: requiredEnv("IMAGEKIT_URL_ENDPOINT", "ImageKit")
});

export const getAppConfig = (): AppConfig => {
    const nodeEnv = parseNodeEnv();

    return {
        nodeEnv,
        port: parsePort(),
        auth: getAuthConfig(),
        security: {
            corsAllowedOrigins: getConfiguredCorsOrigins(),
            jsonBodyLimit: readEnv("JSON_BODY_LIMIT") ?? "1mb",
            trustProxy: parseBoolean(
                "TRUST_PROXY",
                readEnv("VERCEL") === "1"
            )
        }
    };
};

export const isAllowedCorsOrigin = (
    origin: string | undefined,
    config: AppConfig = getAppConfig()
) => {
    if (origin === undefined) {
        return true;
    }

    if (config.security.corsAllowedOrigins.includes(origin)) {
        return true;
    }

    return config.nodeEnv !== "production"
        && LOCALHOST_ORIGIN.test(origin);
};
