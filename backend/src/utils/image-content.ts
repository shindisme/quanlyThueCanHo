import { AppError } from "../errors/app-error.js";

const startsWith = (
    buffer: Buffer,
    signature: readonly number[]
) => (
    buffer.length >= signature.length
    && signature.every((byte, index) => buffer[index] === byte)
);

const isJpeg = (buffer: Buffer) =>
    startsWith(buffer, [0xff, 0xd8, 0xff]);

const isPng = (buffer: Buffer) => startsWith(
    buffer,
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
);

const isWebp = (buffer: Buffer) => (
    startsWith(buffer, [0x52, 0x49, 0x46, 0x46])
    && buffer.length >= 12
    && buffer.subarray(8, 12).equals(
        Buffer.from([0x57, 0x45, 0x42, 0x50])
    )
);

const matchesMimeType = (
    mimetype: string,
    buffer: Buffer
) => {
    switch (mimetype) {
        case "image/jpeg":
            return isJpeg(buffer);
        case "image/png":
            return isPng(buffer);
        case "image/webp":
            return isWebp(buffer);
        default:
            return false;
    }
};

export const assertValidImageContent = (
    file: Pick<Express.Multer.File, "buffer" | "mimetype">
) => {
    if (!matchesMimeType(file.mimetype, file.buffer)) {
        throw new AppError(
            400,
            "INVALID_FILE_CONTENT",
            "Image bytes do not match the declared JPEG, PNG, or WebP type"
        );
    }
};
