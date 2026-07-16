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
        "Dữ liệu yêu cầu không hợp lệ",
        [{
            field: "body",
            message: "Cần cung cấp ít nhất một trường dữ liệu hoặc tệp tin"
        }]
    );
};

