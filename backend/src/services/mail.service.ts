import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

type ViewingScheduleEmailData = {
    to: string;
    guestName: string;
    apartmentLabel: string;
    buildingAddress: string;
    scheduleTime: Date;
};

let transporter: Transporter | null = null;

const getRequiredEnv = (key: string) => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Thiếu cấu hình gửi email: ${key}`);
    }
    return value;
};

const getTransporter = () => {
    if (transporter) return transporter;

    const port = Number(process.env.SMTP_PORT ?? 587);
    if (Number.isNaN(port)) {
        throw new Error("SMTP_PORT không hợp lệ");
    }

    transporter = nodemailer.createTransport({
        host: getRequiredEnv("SMTP_HOST"),
        port,
        secure: (process.env.SMTP_SECURE ?? "false").toLowerCase() === "true",
        auth: {
            user: getRequiredEnv("SMTP_USER"),
            pass: getRequiredEnv("SMTP_PASS")
        }
    });

    return transporter;
};

const escapeHtml = (value: string) =>
    value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

const formatScheduleTime = (date: Date) =>
    new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "full",
        timeStyle: "short",
        timeZone: "Asia/Ho_Chi_Minh"
    }).format(date);

export const sendViewingScheduleConfirmedEmail = async (data: ViewingScheduleEmailData) => {
    const scheduleTime = formatScheduleTime(data.scheduleTime);
    const guestName = escapeHtml(data.guestName);
    const apartmentLabel = escapeHtml(data.apartmentLabel);
    const buildingAddress = escapeHtml(data.buildingAddress);

    await getTransporter().sendMail({
        from: getRequiredEnv("SMTP_FROM"),
        to: data.to,
        subject: "Lịch xem phòng của bạn đã được xác nhận",
        text: [
            `Xin chào ${data.guestName},`,
            "",
            "Quản lý đã xác nhận lịch xem phòng của bạn.",
            `Căn hộ: ${data.apartmentLabel}`,
            `Địa chỉ tòa nhà: ${data.buildingAddress}`,
            `Thời gian xem: ${scheduleTime}`,
            "Trạng thái: Đã xác nhận.",
            "",
            "Vui lòng có mặt đúng giờ. Cảm ơn bạn đã quan tâm."
        ].join("\n"),
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
                <h2 style="margin: 0 0 16px;">Lịch xem phòng đã được xác nhận</h2>
                <p>Xin chào <strong>${guestName}</strong>,</p>
                <p>Quản lý đã xác nhận lịch xem phòng của bạn.</p>
                <p><strong>Căn hộ:</strong> ${apartmentLabel}</p>
                <p><strong>Địa chỉ tòa nhà:</strong> ${buildingAddress}</p>
                <p><strong>Thời gian xem:</strong> ${escapeHtml(scheduleTime)}</p>
                <p><strong>Trạng thái:</strong> Đã xác nhận.</p>
                <p>Vui lòng có mặt đúng giờ. Cảm ơn bạn đã quan tâm.</p>
            </div>
        `
    });
};

export const sendViewingScheduleCancelledEmail = async (data: ViewingScheduleEmailData) => {
    const scheduleTime = formatScheduleTime(data.scheduleTime);
    const guestName = escapeHtml(data.guestName);
    const apartmentLabel = escapeHtml(data.apartmentLabel);
    const buildingAddress = escapeHtml(data.buildingAddress);

    await getTransporter().sendMail({
        from: getRequiredEnv("SMTP_FROM"),
        to: data.to,
        subject: "Lịch xem phòng của bạn đã bị hủy",
        text: [
            `Xin chào ${data.guestName},`,
            "",
            "Quản lý đã hủy lịch xem phòng của bạn.",
            `Căn hộ: ${data.apartmentLabel}`,
            `Địa chỉ tòa nhà: ${data.buildingAddress}`,
            `Thời gian xem: ${scheduleTime}`,
            "Trạng thái: Đã hủy.",
            "",
            "Vui lòng liên hệ với chúng tôi nếu bạn cần thêm thông tin."
        ].join("\n"),
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
                <h2 style="margin: 0 0 16px;">Lịch xem phòng đã bị hủy</h2>
                <p>Xin chào <strong>${guestName}</strong>,</p>
                <p>Quản lý đã hủy lịch xem phòng của bạn.</p>
                <p><strong>Căn hộ:</strong> ${apartmentLabel}</p>
                <p><strong>Địa chỉ tòa nhà:</strong> ${buildingAddress}</p>
                <p><strong>Thời gian xem:</strong> ${escapeHtml(scheduleTime)}</p>
                <p><strong>Trạng thái:</strong> Đã hủy.</p>
                <p>Vui lòng liên hệ với chúng tôi nếu bạn cần thêm thông tin.</p>
            </div>
        `
    });
};

export const sendViewingScheduleConfirmationEmail = async (data: ViewingScheduleEmailData) => {
    const scheduleTime = formatScheduleTime(data.scheduleTime);
    const guestName = escapeHtml(data.guestName);
    const apartmentLabel = escapeHtml(data.apartmentLabel);
    const buildingAddress = escapeHtml(data.buildingAddress);

    await getTransporter().sendMail({
        from: getRequiredEnv("SMTP_FROM"),
        to: data.to,
        subject: "Xác nhận yêu cầu đặt lịch xem phòng",
        text: [
            `Xin chào ${data.guestName},`,
            "",
            "Hệ thống đã nhận yêu cầu đặt lịch xem phòng của bạn.",
            `Căn hộ: ${data.apartmentLabel}`,
            `Địa chỉ tòa nhà: ${data.buildingAddress}`,
            `Thời gian xem: ${scheduleTime}`,
            "Trạng thái: Đang chờ quản trị viên xác nhận.",
            "",
            "Cảm ơn bạn đã quan tâm."
        ].join("\n"),
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
                <h2 style="margin: 0 0 16px;">Xác nhận yêu cầu đặt lịch xem phòng</h2>
                <p>Xin chào <strong>${guestName}</strong>,</p>
                <p>Hệ thống đã nhận yêu cầu đặt lịch xem phòng của bạn.</p>
                <p><strong>Căn hộ:</strong> ${apartmentLabel}</p>
                <p><strong>Địa chỉ tòa nhà:</strong> ${buildingAddress}</p>
                <p><strong>Thời gian xem:</strong> ${escapeHtml(scheduleTime)}</p>
                <p><strong>Trạng thái:</strong> Đang chờ quản trị viên xác nhận.</p>
                <p>Cảm ơn bạn đã quan tâm.</p>
            </div>
        `
    });
};

type TenantActivationEmailData = {
    to: string;
    tenantName: string;
    username: string;
    initialPassword: string;
    activationUrl: string;
};

export const sendTenantActivationEmail = async (
    data: TenantActivationEmailData
) => {
    const tenantName = escapeHtml(data.tenantName);
    const username = escapeHtml(data.username);
    const initialPassword = escapeHtml(data.initialPassword);
    const activationUrl = escapeHtml(data.activationUrl);

    await getTransporter().sendMail({
        from: getRequiredEnv("SMTP_FROM"),
        to: data.to,
        subject: "Kích hoạt tài khoản thuê căn hộ",
        text: [
            `Xin chào ${data.tenantName},`,
            "",
            "Hợp đồng thuê căn hộ của bạn đã được lập thành công.",
            `Tên đăng nhập: ${data.username}`,
            `Mật khẩu tạm thời: ${data.initialPassword}`,
            `Link kích hoạt: ${data.activationUrl}`,
            "",
            "Vui lòng bấm link kích hoạt trước khi đăng nhập."
        ].join("\n"),
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
                <h2 style="margin: 0 0 16px;">Kích hoạt tài khoản thuê căn hộ</h2>
                <p>Xin chào <strong>${tenantName}</strong>,</p>
                <p>Hợp đồng thuê căn hộ của bạn đã được lập thành công.</p>
                <p><strong>Tên đăng nhập:</strong> ${username}</p>
                <p><strong>Mật khẩu tạm thời:</strong> ${initialPassword}</p>
                <p>
                    <a href="${activationUrl}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;">
                        Kích hoạt tài khoản
                    </a>
                </p>
                <p>Vui lòng kích hoạt tài khoản trước khi đăng nhập.</p>
            </div>
        `
    });
};