import type {
    Request,
    Response
} from "express";
import { AppError } from "../errors/app-error.js";
import { withCompensatedImageUploads } from "../services/image-upload.service.js";
import { sendSuccess } from "../utils/api-response.js";

export const uploadMultipleImages = async (
    request: Request,
    response: Response
) => {
    const files =
        (request.files as Express.Multer.File[] | undefined) ?? [];

    if (files.length === 0) {
        throw new AppError(
            400,
            "FILES_REQUIRED",
            "At least one image is required"
        );
    }

    const urls = await withCompensatedImageUploads(
        files,
        "/buildings",
        async (images) => images.map(({ url }) => url)
    );

    return sendSuccess(response, { urls });
};
