const JPEG_SIGNATURE = Buffer.from([
    0xff,
    0xd8,
    0xff,
    0xe0
]);

export const jpegFixture = (payload = "image") =>
    Buffer.concat([
        JPEG_SIGNATURE,
        Buffer.from(payload)
    ]);
