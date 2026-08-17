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
            `Ngày xem: ${scheduleTime}`,
            "Trạng thái: Đã xác nhận.",
            "",
            "Vui lòng chuẩn bị theo lịch đã xác nhận. Cảm ơn bạn đã quan tâm."
        ].join("\n"),
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
                <h2 style="margin: 0 0 16px;">Lịch xem phòng đã được xác nhận</h2>
                <p>Xin chào <strong>${guestName}</strong>,</p>
                <p>Quản lý đã xác nhận lịch xem phòng của bạn.</p>
                <p><strong>Căn hộ:</strong> ${apartmentLabel}</p>
                <p><strong>Địa chỉ tòa nhà:</strong> ${buildingAddress}</p>
                <p><strong>Ngày xem:</strong> ${escapeHtml(scheduleTime)}</p>
                <p><strong>Trạng thái:</strong> Đã xác nhận.</p>
                <p>Vui lòng chuẩn bị theo lịch đã xác nhận. Cảm ơn bạn đã quan tâm.</p>
            </div>
        `
    });
};

export const sendViewingScheduleCancelledEmail = async (data: ViewingScheduleEmailData & { cancelReason?: string }) => {
    const scheduleTime = formatScheduleTime(data.scheduleTime);
    const guestName = escapeHtml(data.guestName);
    const apartmentLabel = escapeHtml(data.apartmentLabel);
    const buildingAddress = escapeHtml(data.buildingAddress);
    const reasonText = data.cancelReason ? `Lý do hủy: ${data.cancelReason}` : "";
    const reasonHtml = data.cancelReason
        ? `<p style="color: #dc2626; margin-top: 8px;"><strong>Lý do hủy:</strong> ${escapeHtml(data.cancelReason)}</p>`
        : "";

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
            `Ngày xem: ${scheduleTime}`,
            "Trạng thái: Đã hủy.",
            reasonText,
            "",
            "Vui lòng liên hệ với chúng tôi nếu bạn cần thêm thông tin."
        ].filter(Boolean).join("\n"),
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
                <h2 style="margin: 0 0 16px;">Lịch xem phòng đã bị hủy</h2>
                <p>Xin chào <strong>${guestName}</strong>,</p>
                <p>Quản lý đã hủy lịch xem phòng của bạn.</p>
                <p><strong>Căn hộ:</strong> ${apartmentLabel}</p>
                <p><strong>Địa chỉ tòa nhà:</strong> ${buildingAddress}</p>
                <p><strong>Ngày xem:</strong> ${escapeHtml(scheduleTime)}</p>
                <p><strong>Trạng thái:</strong> Đã hủy.</p>
                ${reasonHtml}
                <p style="margin-top: 16px;">Vui lòng liên hệ với chúng tôi nếu bạn cần thêm thông tin.</p>
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
            `Ngày xem: ${scheduleTime}`,
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
                <p><strong>Ngày xem:</strong> ${escapeHtml(scheduleTime)}</p>
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
type ReservationDepositPaymentEmailData = {
    to: string;
    tenantName: string;
    invoiceCode: string;
    depositAmount: number;
    apartmentLabel: string;
    buildingAddress: string;
    paymentUrl: string;
    moveInDeadline: Date;
};

type ReservationDepositPaidEmailData = Omit<
    ReservationDepositPaymentEmailData,
    "paymentUrl"
>;
type ReservationExpiredEmailData = Pick<
    ReservationDepositPaymentEmailData,
    "to" | "tenantName" | "apartmentLabel" | "buildingAddress" | "moveInDeadline"
>;

const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "full",
        timeZone: "Asia/Ho_Chi_Minh"
    }).format(date);

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0
    }).format(amount);

export const sendReservationDepositPaymentEmail = async (
    data: ReservationDepositPaymentEmailData
) => {
    const tenantName = escapeHtml(data.tenantName);
    const invoiceCode = escapeHtml(data.invoiceCode);
    const depositAmount = formatCurrency(data.depositAmount);
    const apartmentLabel = escapeHtml(data.apartmentLabel);
    const buildingAddress = escapeHtml(data.buildingAddress);
    const paymentUrl = escapeHtml(data.paymentUrl);
    const moveInDeadline = formatDate(data.moveInDeadline);

    await getTransporter().sendMail({
        from: getRequiredEnv("SMTP_FROM"),
        to: data.to,
        subject: `Thông tin thanh toán tiền cọc phòng ${data.invoiceCode}`,
        text: [
            `Xin chào ${data.tenantName},`,
            "",
            "Hệ thống đã tạo hóa đơn đặt cọc phòng cho bạn.",
            `Mã hóa đơn: ${data.invoiceCode}`,
            `Căn hộ: ${data.apartmentLabel}`,
            `Địa chỉ: ${data.buildingAddress}`,
            `Số tiền cọc: ${depositAmount}`,
            `Hạn nhận phòng/ký hợp đồng: ${moveInDeadline}`,
            `Link thanh toán: ${data.paymentUrl}`,
            "",
            "Vui lòng thanh toán tiền cọc để giữ phòng."
        ].join("\n"),
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
                <h2 style="margin: 0 0 16px;">Thông tin thanh toán tiền cọc</h2>
                <p>Xin chào <strong>${tenantName}</strong>,</p>
                <p>Hệ thống đã tạo hóa đơn đặt cọc phòng cho bạn.</p>
                <p><strong>Mã hóa đơn:</strong> ${invoiceCode}</p>
                <p><strong>Căn hộ:</strong> ${apartmentLabel}</p>
                <p><strong>Địa chỉ:</strong> ${buildingAddress}</p>
                <p><strong>Số tiền cọc:</strong> ${escapeHtml(depositAmount)}</p>
                <p><strong>Hạn nhận phòng/ký hợp đồng:</strong> ${escapeHtml(moveInDeadline)}</p>
                <p>
                    <a href="${paymentUrl}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;">
                        Thanh toán tiền cọc
                    </a>
                </p>
                <p>Vui lòng thanh toán tiền cọc để giữ phòng.</p>
            </div>
        `
    });
};

export const sendReservationDepositPaidEmail = async (
    data: ReservationDepositPaidEmailData
) => {
    const tenantName = escapeHtml(data.tenantName);
    const invoiceCode = escapeHtml(data.invoiceCode);
    const depositAmount = formatCurrency(data.depositAmount);
    const apartmentLabel = escapeHtml(data.apartmentLabel);
    const buildingAddress = escapeHtml(data.buildingAddress);
    const moveInDeadline = formatDate(data.moveInDeadline);

    await getTransporter().sendMail({
        from: getRequiredEnv("SMTP_FROM"),
        to: data.to,
        subject: `Đã thanh toán tiền cọc phòng ${data.invoiceCode}`,
        text: [
            `Xin chào ${data.tenantName},`,
            "",
            "Hệ thống đã ghi nhận bạn thanh toán tiền cọc thành công.",
            `Mã hóa đơn: ${data.invoiceCode}`,
            `Căn hộ: ${data.apartmentLabel}`,
            `Địa chỉ: ${data.buildingAddress}`,
            `Số tiền cọc: ${depositAmount}`,
            `Ngày nhận phòng/ký hợp đồng chậm nhất: ${moveInDeadline}`,
            "",
            "Quy định giữ phòng:",
            `Bạn cần đến nhận phòng và ký hợp đồng chậm nhất vào ${moveInDeadline}.`,
            "Nếu sau ngày này bạn không đến nhận phòng và ký hợp đồng, hệ thống xem như bạn bỏ cọc và không thuê căn hộ. Tiền cọc đã thanh toán sẽ không được hoàn lại."
        ].join("\n"),
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
                <h2 style="margin: 0 0 16px;">Đã thanh toán tiền cọc</h2>
                <p>Xin chào <strong>${tenantName}</strong>,</p>
                <p>Hệ thống đã ghi nhận bạn thanh toán tiền cọc thành công.</p>
                <p><strong>Mã hóa đơn:</strong> ${invoiceCode}</p>
                <p><strong>Căn hộ:</strong> ${apartmentLabel}</p>
                <p><strong>Địa chỉ:</strong> ${buildingAddress}</p>
                <p><strong>Số tiền cọc:</strong> ${escapeHtml(depositAmount)}</p>
                <p><strong>Ngày nhận phòng/ký hợp đồng chậm nhất:</strong> ${escapeHtml(moveInDeadline)}</p>
                <h3 style="margin: 18px 0 8px;">Quy định giữ phòng</h3>
                <p>Bạn cần đến nhận phòng và ký hợp đồng chậm nhất vào <strong>${escapeHtml(moveInDeadline)}</strong>.</p>
                <p>Nếu sau ngày này bạn không đến nhận phòng và ký hợp đồng, hệ thống xem như bạn bỏ cọc và không thuê căn hộ. Tiền cọc đã thanh toán sẽ không được hoàn lại.</p>
            </div>
        `
    });
};
export const sendReservationExpiredEmail = async (
    data: ReservationExpiredEmailData
) => {
    const tenantName = escapeHtml(data.tenantName);
    const apartmentLabel = escapeHtml(data.apartmentLabel);
    const buildingAddress = escapeHtml(data.buildingAddress);
    const moveInDeadline = formatDate(data.moveInDeadline);

    await getTransporter().sendMail({
        from: getRequiredEnv("SMTP_FROM"),
        to: data.to,
        subject: `Đã hết thời gian giữ chỗ căn hộ ${data.apartmentLabel}`,
        text: [
            `Xin chào ${data.tenantName},`,
            "",
            "Thời gian giữ chỗ căn hộ của bạn đã hết.",
            `Căn hộ: ${data.apartmentLabel}`,
            `Địa chỉ: ${data.buildingAddress}`,
            `Hạn nhận phòng/ký hợp đồng: ${moveInDeadline}`,
            "",
            "Do bạn chưa đến nhận phòng và ký hợp đồng đúng hạn, hệ thống đã chuyển căn hộ về trạng thái còn trống. Tiền cọc đã thanh toán được ghi nhận là bỏ cọc theo quy định."
        ].join("\n"),
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
                <h2 style="margin: 0 0 16px;">Đã hết thời gian giữ chỗ căn hộ</h2>
                <p>Xin chào <strong>${tenantName}</strong>,</p>
                <p>Thời gian giữ chỗ căn hộ của bạn đã hết.</p>
                <p><strong>Căn hộ:</strong> ${apartmentLabel}</p>
                <p><strong>Địa chỉ:</strong> ${buildingAddress}</p>
                <p><strong>Hạn nhận phòng/ký hợp đồng:</strong> ${escapeHtml(moveInDeadline)}</p>
                <p>Do bạn chưa đến nhận phòng và ký hợp đồng đúng hạn, hệ thống đã chuyển căn hộ về trạng thái còn trống. Tiền cọc đã thanh toán được ghi nhận là bỏ cọc theo quy định.</p>
            </div>
        `
    });
};