import { imagekit } from "../config/imagekit.js";
import { assertValidImageContent } from "../utils/image-content.js";

type UploadedImage = {
    url: string;
    fileId: string;
};

export const withCompensatedImageUploads = async <T>(
    files: Express.Multer.File[],
    folder: "/buildings" | "/apartments",
    operation: (images: UploadedImage[]) => Promise<T>
) => {
    const uploadedImages: UploadedImage[] = [];

    try {
        for (const file of files) {
            assertValidImageContent(file);

            const uploaded = await imagekit.upload({
                file: file.buffer.toString("base64"),
                fileName: `${Date.now()}_${file.originalname}`,
                folder
            });

            uploadedImages.push({
                url: uploaded.url,
                fileId: uploaded.fileId
            });
        }

        return await operation(uploadedImages);
    } catch (error) {
        const cleanupResults = await Promise.allSettled(
            uploadedImages.map(async ({ fileId }) => {
                await imagekit.deleteFile(fileId);
            })
        );
        const cleanupFailures = cleanupResults.filter(
            (result) => result.status === "rejected"
        );

        if (cleanupFailures.length > 0) {
            console.error(
                "Lỗi khi xóa file đã upload",
                cleanupFailures.map((result) => result.reason)
            );
        }

        throw error;
    }
};
