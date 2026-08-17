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

const VIEWING_OFFICE_HOURS_TEXT = [
    "Vui lòng đến xem phòng trong giờ hành chính:",
    "8h00 - 11h30",
    "13h30 - 17h00"
];

const VIEWING_OFFICE_HOURS_HTML = `
                <div style="margin: 16px 0; padding: 12px 14px; background: #f9fafb; border-left: 4px solid #2563eb;">
                    <p style="margin: 0 0 6px;"><strong>Vui lòng đến xem phòng trong giờ hành chính:</strong></p>
                    <p style="margin: 0;">8h00 - 11h30</p>
                    <p style="margin: 0;">13h30 - 17h00</p>
                </div>
`;

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
            "Ban quản lý đã xác nhận lịch xem phòng của bạn. Thông tin chi tiết như sau:",
            `Căn hộ: ${data.apartmentLabel}`,
            `Địa chỉ tòa nhà: ${data.buildingAddress}`,
            `Ngày xem: ${scheduleTime}`,
            "Trạng thái: Đã xác nhận.",
            "",
            ...VIEWING_OFFICE_HOURS_TEXT,
            "",
            "Khi đến nơi, vui lòng mang theo giấy tờ tùy thân và liên hệ bộ phận quản lý/tư vấn để được hỗ trợ xem phòng.",
            "Nếu cần thay đổi lịch hẹn, vui lòng phản hồi email này hoặc liên hệ ban quản lý trước thời gian đã hẹn.",
            "",
            "Trân trọng,",
            "Ban quản lý căn hộ"
        ].join("\n"),
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
                <h2 style="margin: 0 0 16px;">Lịch xem phòng đã được xác nhận</h2>
                <p>Xin chào <strong>${guestName}</strong>,</p>
                <p>Ban quản lý đã xác nhận lịch xem phòng của bạn. Thông tin chi tiết như sau:</p>
                <p><strong>Căn hộ:</strong> ${apartmentLabel}</p>
                <p><strong>Địa chỉ tòa nhà:</strong> ${buildingAddress}</p>
                <p><strong>Ngày xem:</strong> ${escapeHtml(scheduleTime)}</p>
                <p><strong>Trạng thái:</strong> Đã xác nhận.</p>
                ${VIEWING_OFFICE_HOURS_HTML}
                <p>Khi đến nơi, vui lòng mang theo giấy tờ tùy thân và liên hệ bộ phận quản lý/tư vấn để được hỗ trợ xem phòng.</p>
                <p>Nếu cần thay đổi lịch hẹn, vui lòng phản hồi email này hoặc liên hệ ban quản lý trước thời gian đã hẹn.</p>
                <p>Trân trọng,<br/>Ban quản lý căn hộ</p>
            </div>
        `
    });
};

export const sendViewingScheduleCancelledEmail = async (data: ViewingScheduleEmailData & { cancelReason?: string }) => {
    const scheduleTime = formatScheduleTime(data.scheduleTime);
    const guestName = escapeHtml(data.guestName);
    const apartmentLabel = escapeHtml(data.apartmentLabel);
    const buildingAddress = escapeHtml(data.buildingAddress);
    const reasonText = data.cancelReason ? `Lý do hủy lịch: ${data.cancelReason}` : "";
    const reasonHtml = data.cancelReason
        ? `<p style="color: #dc2626; margin-top: 8px;"><strong>Lý do hủy lịch:</strong> ${escapeHtml(data.cancelReason)}</p>`
        : "";

    await getTransporter().sendMail({
        from: getRequiredEnv("SMTP_FROM"),
        to: data.to,
        subject: "Lịch xem phòng của bạn đã bị hủy",
        text: [
            `Xin chào ${data.guestName},`,
            "",
            "Rất tiếc, lịch xem phòng của bạn đã được ban quản lý hủy. Thông tin lịch đã hủy:",
            `Căn hộ: ${data.apartmentLabel}`,
            `Địa chỉ tòa nhà: ${data.buildingAddress}`,
            `Ngày xem: ${scheduleTime}`,
            "Trạng thái: Đã hủy.",
            reasonText,
            "",
            "Nếu bạn vẫn quan tâm đến căn hộ này hoặc muốn đặt lại lịch xem phòng, vui lòng phản hồi email này để được hỗ trợ.",
            "",
            "Trân trọng,",
            "Ban quản lý căn hộ"
        ].filter(Boolean).join("\n"),
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
                <h2 style="margin: 0 0 16px;">Lịch xem phòng đã bị hủy</h2>
                <p>Xin chào <strong>${guestName}</strong>,</p>
                <p>Rất tiếc, lịch xem phòng của bạn đã được ban quản lý hủy. Thông tin lịch đã hủy:</p>
                <p><strong>Căn hộ:</strong> ${apartmentLabel}</p>
                <p><strong>Địa chỉ tòa nhà:</strong> ${buildingAddress}</p>
                <p><strong>Ngày xem:</strong> ${escapeHtml(scheduleTime)}</p>
                <p><strong>Trạng thái:</strong> Đã hủy.</p>
                ${reasonHtml}
                <p style="margin-top: 16px;">Nếu bạn vẫn quan tâm đến căn hộ này hoặc muốn đặt lại lịch xem phòng, vui lòng phản hồi email này để được hỗ trợ.</p>
                <p>Trân trọng,<br/>Ban quản lý căn hộ</p>
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
            "Hệ thống đã tiếp nhận yêu cầu đặt lịch xem phòng của bạn. Ban quản lý sẽ kiểm tra và gửi email xác nhận khi lịch được duyệt.",
            `Căn hộ: ${data.apartmentLabel}`,
            `Địa chỉ tòa nhà: ${data.buildingAddress}`,
            `Ngày xem: ${scheduleTime}`,
            "Trạng thái: Đang chờ quản trị viên xác nhận.",
            "",
            ...VIEWING_OFFICE_HOURS_TEXT,
            "",
            "Lưu ý: thời gian xem phòng sẽ được sắp xếp trong khung giờ hành chính nêu trên. Nếu thời gian bạn chọn chưa phù hợp, ban quản lý sẽ liên hệ để điều chỉnh.",
            "Cảm ơn bạn đã quan tâm đến căn hộ.",
            "",
            "Trân trọng,",
            "Ban quản lý căn hộ"
        ].join("\n"),
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
                <h2 style="margin: 0 0 16px;">Xác nhận yêu cầu đặt lịch xem phòng</h2>
                <p>Xin chào <strong>${guestName}</strong>,</p>
                <p>Hệ thống đã tiếp nhận yêu cầu đặt lịch xem phòng của bạn. Ban quản lý sẽ kiểm tra và gửi email xác nhận khi lịch được duyệt.</p>
                <p><strong>Căn hộ:</strong> ${apartmentLabel}</p>
                <p><strong>Địa chỉ tòa nhà:</strong> ${buildingAddress}</p>
                <p><strong>Ngày xem:</strong> ${escapeHtml(scheduleTime)}</p>
                <p><strong>Trạng thái:</strong> Đang chờ quản trị viên xác nhận.</p>
                ${VIEWING_OFFICE_HOURS_HTML}
                <p>Lưu ý: thời gian xem phòng sẽ được sắp xếp trong khung giờ hành chính nêu trên. Nếu thời gian bạn chọn chưa phù hợp, ban quản lý sẽ liên hệ để điều chỉnh.</p>
                <p>Cảm ơn bạn đã quan tâm đến căn hộ.</p>
                <p>Trân trọng,<br/>Ban quản lý căn hộ</p>
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
            "Hợp đồng thuê căn hộ của bạn đã được lập thành công. Hệ thống đã tạo tài khoản người thuê để bạn theo dõi hợp đồng, hóa đơn và các thông báo liên quan.",
            `Tên đăng nhập: ${data.username}`,
            `Mật khẩu tạm thời: ${data.initialPassword}`,
            `Link kích hoạt: ${data.activationUrl}`,
            "",
            "Vui lòng truy cập link kích hoạt, đăng nhập bằng thông tin trên và đổi mật khẩu sau lần đăng nhập đầu tiên.",
            "Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu tạm thời cho người khác.",
            "",
            "Trân trọng,",
            "Ban quản lý căn hộ"
        ].join("\n"),
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
                <h2 style="margin: 0 0 16px;">Kích hoạt tài khoản thuê căn hộ</h2>
                <p>Xin chào <strong>${tenantName}</strong>,</p>
                <p>Hợp đồng thuê căn hộ của bạn đã được lập thành công. Hệ thống đã tạo tài khoản người thuê để bạn theo dõi hợp đồng, hóa đơn và các thông báo liên quan.</p>
                <p><strong>Tên đăng nhập:</strong> ${username}</p>
                <p><strong>Mật khẩu tạm thời:</strong> ${initialPassword}</p>
                <p>
                    <a href="${activationUrl}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;">
                        Kích hoạt tài khoản
                    </a>
                </p>
                <p>Vui lòng truy cập link kích hoạt, đăng nhập bằng thông tin trên và đổi mật khẩu sau lần đăng nhập đầu tiên.</p>
                <p>Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu tạm thời cho người khác.</p>
                <p>Trân trọng,<br/>Ban quản lý căn hộ</p>
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
            "Hệ thống đã tạo hóa đơn thanh toán tiền cọc để giữ căn hộ cho bạn. Vui lòng kiểm tra thông tin chi tiết bên dưới:",
            `Mã hóa đơn: ${data.invoiceCode}`,
            `Căn hộ: ${data.apartmentLabel}`,
            `Địa chỉ: ${data.buildingAddress}`,
            `Số tiền cọc: ${depositAmount}`,
            `Hạn nhận phòng/ký hợp đồng: ${moveInDeadline}`,
            `Link thanh toán: ${data.paymentUrl}`,
            "",
            "Vui lòng hoàn tất thanh toán tiền cọc đúng hạn để giữ quyền ưu tiên thuê căn hộ. Sau khi thanh toán thành công, hệ thống sẽ gửi email xác nhận.",
            "",
            "Trân trọng,",
            "Ban quản lý căn hộ"
        ].join("\n"),
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
                <h2 style="margin: 0 0 16px;">Thông tin thanh toán tiền cọc</h2>
                <p>Xin chào <strong>${tenantName}</strong>,</p>
                <p>Hệ thống đã tạo hóa đơn thanh toán tiền cọc để giữ căn hộ cho bạn. Vui lòng kiểm tra thông tin chi tiết bên dưới:</p>
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
                <p>Vui lòng hoàn tất thanh toán tiền cọc đúng hạn để giữ quyền ưu tiên thuê căn hộ. Sau khi thanh toán thành công, hệ thống sẽ gửi email xác nhận.</p>
                <p>Trân trọng,<br/>Ban quản lý căn hộ</p>
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
            "Hệ thống đã ghi nhận thanh toán tiền cọc của bạn thành công. Thông tin giao dịch và căn hộ như sau:",
            `Mã hóa đơn: ${data.invoiceCode}`,
            `Căn hộ: ${data.apartmentLabel}`,
            `Địa chỉ: ${data.buildingAddress}`,
            `Số tiền cọc: ${depositAmount}`,
            `Ngày nhận phòng/ký hợp đồng chậm nhất: ${moveInDeadline}`,
            "",
            "Quy định giữ phòng:",
            `Bạn cần đến nhận phòng và ký hợp đồng chậm nhất vào ${moveInDeadline}.`,
            "Nếu quá thời hạn trên mà bạn chưa đến nhận phòng và ký hợp đồng, hệ thống sẽ xem như bạn không tiếp tục thuê căn hộ. Tiền cọc đã thanh toán sẽ không được hoàn lại theo quy định giữ phòng.",
            "",
            "Trân trọng,",
            "Ban quản lý căn hộ"
        ].join("\n"),
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
                <h2 style="margin: 0 0 16px;">Đã thanh toán tiền cọc</h2>
                <p>Xin chào <strong>${tenantName}</strong>,</p>
                <p>Hệ thống đã ghi nhận thanh toán tiền cọc của bạn thành công. Thông tin giao dịch và căn hộ như sau:</p>
                <p><strong>Mã hóa đơn:</strong> ${invoiceCode}</p>
                <p><strong>Căn hộ:</strong> ${apartmentLabel}</p>
                <p><strong>Địa chỉ:</strong> ${buildingAddress}</p>
                <p><strong>Số tiền cọc:</strong> ${escapeHtml(depositAmount)}</p>
                <p><strong>Ngày nhận phòng/ký hợp đồng chậm nhất:</strong> ${escapeHtml(moveInDeadline)}</p>
                <h3 style="margin: 18px 0 8px;">Quy định giữ phòng</h3>
                <p>Bạn cần đến nhận phòng và ký hợp đồng chậm nhất vào <strong>${escapeHtml(moveInDeadline)}</strong>.</p>
                <p>Nếu quá thời hạn trên mà bạn chưa đến nhận phòng và ký hợp đồng, hệ thống sẽ xem như bạn không tiếp tục thuê căn hộ. Tiền cọc đã thanh toán sẽ không được hoàn lại theo quy định giữ phòng.</p>
                <p>Trân trọng,<br/>Ban quản lý căn hộ</p>
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
        subject: `Thông báo hết thời gian giữ chỗ căn hộ ${data.apartmentLabel}`,
        text: [
            `Xin chào ${data.tenantName},`,
            "",
            "Thời gian giữ chỗ căn hộ của bạn đã kết thúc do chưa hoàn tất nhận phòng và ký hợp đồng đúng hạn.",
            `Căn hộ: ${data.apartmentLabel}`,
            `Địa chỉ: ${data.buildingAddress}`,
            `Hạn nhận phòng/ký hợp đồng: ${moveInDeadline}`,
            "",
            "Theo quy định giữ phòng, căn hộ đã được chuyển về trạng thái còn trống để tiếp tục cho thuê. Tiền cọc đã thanh toán được ghi nhận là bỏ cọc và không được hoàn lại.",
            "Nếu bạn cần trao đổi thêm về trường hợp này, vui lòng liên hệ ban quản lý để được hỗ trợ.",
            "",
            "Trân trọng,",
            "Ban quản lý căn hộ"
        ].join("\n"),
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
                <h2 style="margin: 0 0 16px;">Thông báo hết thời gian giữ chỗ căn hộ</h2>
                <p>Xin chào <strong>${tenantName}</strong>,</p>
                <p>Thời gian giữ chỗ căn hộ của bạn đã kết thúc do chưa hoàn tất nhận phòng và ký hợp đồng đúng hạn.</p>
                <p><strong>Căn hộ:</strong> ${apartmentLabel}</p>
                <p><strong>Địa chỉ:</strong> ${buildingAddress}</p>
                <p><strong>Hạn nhận phòng/ký hợp đồng:</strong> ${escapeHtml(moveInDeadline)}</p>
                <p>Theo quy định giữ phòng, căn hộ đã được chuyển về trạng thái còn trống để tiếp tục cho thuê. Tiền cọc đã thanh toán được ghi nhận là bỏ cọc và không được hoàn lại.</p>
                <p>Nếu bạn cần trao đổi thêm về trường hợp này, vui lòng liên hệ ban quản lý để được hỗ trợ.</p>
                <p>Trân trọng,<br/>Ban quản lý căn hộ</p>
            </div>
        `
    });
};
