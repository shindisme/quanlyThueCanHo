import ImageKit from "imagekit";
import { getImageKitConfig } from "./env.js";

type ImageKitClient = InstanceType<typeof ImageKit>;

let client: ImageKitClient | null = null;

const getImageKitClient = () => {
    if (client === null) {
        client = new ImageKit(getImageKitConfig());
    }

    return client;
};

export const imagekit = {
    upload: (
        options: Parameters<ImageKitClient["upload"]>[0]
    ) => getImageKitClient().upload(options),
    deleteFile: (
        fileId: Parameters<ImageKitClient["deleteFile"]>[0]
    ) => getImageKitClient().deleteFile(fileId)
};