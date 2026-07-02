const PNG_SIGNATURE = Buffer.from([
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a
]);

const WEBP_RIFF = Buffer.from([
    0x52,
    0x49,
    0x46,
    0x46,
    0x00,
    0x00,
    0x00,
    0x00,
    0x57,
    0x45,
    0x42,
    0x50
]);

export const pngFixture = (payload = "image") =>
    Buffer.concat([
        PNG_SIGNATURE,
        Buffer.from(payload)
    ]);

export const webpFixture = (payload = "image") =>
    Buffer.concat([
        WEBP_RIFF,
        Buffer.from(payload)
    ]);
