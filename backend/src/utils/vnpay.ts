import crypto from "node:crypto";

export type VnpayParams = Record<string, string>;

const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";

const requireEnv = (name: string) => {
    const value = process.env[name];

    if (!value) {
        throw new Error(`${name} chưa được cấu hình`);
    }

    return value;
};

export const getVnpayConfig = () => ({
    tmnCode: requireEnv("VNPAY_TMN_CODE"),
    hashSecret: requireEnv("VNPAY_HASH_SECRET"),
    paymentUrl: requireEnv("VNPAY_PAYMENT_URL"),
    returnUrl: requireEnv("VNPAY_RETURN_URL"),
    frontendResultUrl:
        process.env.FRONTEND_PAYMENT_RESULT_URL
        || `${requireEnv("FRONTEND_URL")}/tenant/payment-result`
});

export const formatVnpayDate = (date = new Date()) => {
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: VIETNAM_TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23"
    }).formatToParts(date);

    const get = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((part) => part.type === type)?.value ?? "";

    return [
        get("year"),
        get("month"),
        get("day"),
        get("hour"),
        get("minute"),
        get("second")
    ].join("");
};

export const sortVnpayParams = (
    params: Record<string, string | number | undefined | null>
): VnpayParams => {
    const sorted: VnpayParams = {};

    Object.keys(params)
        .filter((key) => {
            const value = params[key];
            return value !== undefined
                && value !== null
                && String(value).length > 0;
        })
        .sort()
        .forEach((key) => {
            sorted[key] = String(params[key]);
        });

    return sorted;
};

const toQueryString = (params: VnpayParams) => {
    const query = new URLSearchParams();

    Object.keys(params)
        .sort()
        .forEach((key) => {
            query.append(key, params[key]);
        });

    return query.toString();
};

export const createVnpaySecureHash = (
    params: VnpayParams,
    hashSecret: string
) => {
    const signData = toQueryString(params);

    return crypto
        .createHmac("sha512", hashSecret)
        .update(Buffer.from(signData, "utf-8"))
        .digest("hex");
};

export const buildVnpayPaymentUrl = (
    baseUrl: string,
    params: Record<string, string | number | undefined | null>,
    hashSecret: string
) => {
    const sortedParams = sortVnpayParams(params);
    const secureHash = createVnpaySecureHash(
        sortedParams,
        hashSecret
    );

    const query = new URLSearchParams({
        ...sortedParams,
        vnp_SecureHash: secureHash
    });

    return `${baseUrl}?${query.toString()}`;
};

const safeEqual = (left: string, right: string) => {
    const leftBuffer = Buffer.from(left, "utf8");
    const rightBuffer = Buffer.from(right, "utf8");

    return leftBuffer.length === rightBuffer.length
        && crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

export const normalizeVnpayCallbackParams = (
    query: Record<string, unknown>
): VnpayParams => {
    const params: VnpayParams = {};

    for (const [key, value] of Object.entries(query)) {
        if (Array.isArray(value)) {
            params[key] = String(value[0]);
        } else if (value !== undefined && value !== null) {
            params[key] = String(value);
        }
    }

    return params;
};

export const verifyVnpaySecureHash = (
    params: VnpayParams,
    hashSecret: string
) => {
    const secureHash = params.vnp_SecureHash;

    if (!secureHash) {
        return false;
    }

    const paramsForHash = { ...params };
    delete paramsForHash.vnp_SecureHash;
    delete paramsForHash.vnp_SecureHashType;

    const sortedParams = sortVnpayParams(paramsForHash);

    const signData = new URLSearchParams(sortedParams).toString();

    const expectedHash = crypto
        .createHmac("sha512", hashSecret)
        .update(Buffer.from(signData, "utf-8"))
        .digest("hex");

    return safeEqual(
        expectedHash.toLowerCase(),
        secureHash.toLowerCase()
    );
};
