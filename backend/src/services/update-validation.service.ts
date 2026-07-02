import { AppError } from "../errors/app-error.js";

export const assertUpdateHasChanges = (
    data: object,
    hasFiles: boolean
) => {
    if (Object.keys(data).length > 0 || hasFiles) {
        return;
    }

    throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Request validation failed",
        [{
            field: "body",
            message: "At least one field or file is required"
        }]
    );
};
