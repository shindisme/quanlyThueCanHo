import QRCode from "qrcode";

export const generateQrCodeDataUrl = async (
    text: string
) => QRCode.toDataURL(text, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 300
});

export const generateQrCodeSvg = async (
    text: string
) => QRCode.toString(text, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 2,
    width: 300
});