import multer from "multer";
import { AppError } from "../errors/app-error.js";

const storage = multer.memoryStorage();

const allowedImageTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp"
]);

export const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 10
    },
    fileFilter: (_request, file, callback) => {
        if (!allowedImageTypes.has(file.mimetype)) {
            callback(new AppError(
                400,
                "INVALID_FILE_TYPE",
                "Only JPEG, PNG, and WebP images are allowed"
            ));
            return;
        }

        callback(null, true);
    }
});
export const uploadMultiple = upload.array("images", 10);
