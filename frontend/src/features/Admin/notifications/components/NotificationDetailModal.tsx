import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import type { Notification } from "../../../../types";
import { formatCurrency } from "../../../../utils/currency";
import { formatDate } from "../../../../utils/date";
import { formatApartmentDisplay, extractInvoiceCode } from "../../../../utils/string";
import { CreditCard, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../../stores/auth.store";
import { invoiceService } from "../../../../services";
import { queryKeys } from "../../../../constants/queryKeys";

interface NotificationDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    notification: Notification | null;
}

export default function NotificationDetailModal({
    isOpen,
    onClose,
    notification,
}: NotificationDetailModalProps) {
    const [showItems, setShowItems] = useState(true);

    const navigate = useNavigate();
    const { role } = useAuthStore();

    const invoiceCode = useMemo(() => extractInvoiceCode(notification), [notification]);

    const { data: invoice = null, isLoading: loadingInvoice } = useQuery({
        queryKey: queryKeys.invoices.byCode(invoiceCode),
        queryFn: async () => {
            if (!invoiceCode) return null;
            const res = await invoiceService.getAll({ search: invoiceCode });
            return res.data?.find((inv) => inv.invoice_code.toUpperCase() === invoiceCode) || null;
        },
        enabled: Boolean(isOpen && invoiceCode),
    });

    if (!notification) return null;

    function getNotificationBadge(type: string) {
        const map: Record<string, { label: string; color: string }> = {
            INVOICE: { label: "Hóa đơn / Tiền điện nước", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
            MAINTENANCE: { label: "Bảo trì / Sửa chữa", color: "bg-amber-50 text-amber-700 border-amber-200" },
            SYSTEM: { label: "Cảnh báo hệ thống", color: "bg-blue-50 text-blue-700 border-blue-200" },
            GENERAL: { label: "Thông báo chung", color: "bg-gray-50 text-gray-700 border-gray-200" },
        };
        const s = map[type] || { label: "Thông tin", color: "bg-gray-50 text-gray-700 border-gray-200" };
        return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.color}`}>{s.label}</span>;
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Chi tiết thông báo" size={invoice ? "lg" : "md"}>
            <div className="space-y-4 text-sm font-sans">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                        <h4 className="font-bold text-gray-900 text-base">{notification.title}</h4>
                        <p className="text-[11px] text-gray-400 font-medium mt-1">
                            {new Date(notification.created_at).toLocaleString("vi-VN")}
                        </p>
                    </div>
                    <div>{getNotificationBadge(notification.type)}</div>
                </div>


                {(notification.apartment || (notification.apartments && notification.apartments.length > 0) || notification.building || notification.recipient_count || notification.tenant) && (
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        {notification.apartment && (
                            <span className="inline-flex items-center gap-1 font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/70">
                                P.{notification.apartment.room_number}{notification.apartment.building?.branch_name ? ` – ${notification.apartment.building.branch_name}` : ""}
                            </span>
                        )}
                        {!notification.apartment && notification.apartments && notification.apartments.length > 1 && (
                            <span className="inline-flex items-center gap-1 font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/70">
                                {notification.apartments.length} căn hộ
                            </span>
                        )}
                        {notification.building && !notification.apartment && (!notification.apartments || notification.apartments.length === 0) && (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/70">
                                Tòa {notification.building.branch_name}
                            </span>
                        )}
                        {notification.tenant && (!notification.recipient_count || notification.recipient_count === 1) && (
                            <span className="inline-flex items-center gap-1 font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                                {notification.tenant.full_name}
                            </span>
                        )}
                    </div>
                )}


                <div className="border border-gray-200 p-3.5 text-gray-600 font-medium leading-relaxed whitespace-pre-wrap py-2 text-sm max-h-62.5 overflow-y-auto">
                    Nội dung: {notification.content}
                </div>

                {/* Loading invoice indicator */}
                {loadingInvoice && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 py-3 bg-gray-50 px-4 rounded-xl border border-gray-150">
                        <Loader2 className="animate-spin text-primary-600" size={16} />
                        <span>Đang truy xuất thông tin chi tiết hóa đơn {invoiceCode}...</span>
                    </div>
                )}

                {/* Invoice Summary Card */}
                {invoice && (
                    <div className="border border-gray-200 bg-gray-50/30 overflow-hidden font-sans mt-3">
                        <div className="bg-gray-100/70 px-4 py-3 flex items-center justify-between border-b border-gray-200">
                            <div className="flex items-center gap-2 font-bold text-gray-800 text-xs uppercase tracking-wider">
                                Đính kèm: Hóa đơn {invoice.invoice_code}
                            </div>
                            <div>
                                {invoice.status === "PAID" ? (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">Đã thanh toán</span>
                                ) : (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-red-55/20 text-red-650 border-red-200">Chưa thanh toán</span>
                                )}
                            </div>
                        </div>

                        <div className="p-4 space-y-3 text-xs">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <span className="text-gray-400 block mb-0.5">Căn hộ:</span>
                                    <span className="font-semibold text-gray-800">
                                        {invoice.contract?.apartment
                                            ? formatApartmentDisplay(invoice.contract.apartment.room_number, invoice.contract.apartment.floor, invoice.contract.apartment.building?.branch_name)
                                            : "Chưa rõ"}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-400 block mb-0.5">Hạn thanh toán:</span>
                                    <span className="font-semibold text-gray-800">
                                        {formatDate(invoice.due_date)}
                                    </span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowItems(!showItems)}
                                className="w-full flex items-center justify-between py-1.5 border-t border-b border-gray-150 text-gray-600 hover:text-gray-850 hover:bg-gray-50/50 px-1 font-semibold transition-all cursor-pointer"
                            >
                                <span>Chi tiết dịch vụ & tiền thuê</span>
                                {showItems ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>

                            {showItems && invoice.items && invoice.items.length > 0 && (
                                <div className="space-y-2 pt-1 text-left">
                                    <table className="w-full text-[11px] text-gray-655 divide-y divide-gray-150">
                                        <thead>
                                            <tr className="text-left font-bold text-gray-400">
                                                <th className="pb-1.5 font-semibold">Tên dịch vụ</th>
                                                <th className="pb-1.5 text-right font-semibold">Số lượng</th>
                                                <th className="pb-1.5 text-right font-semibold">Thành tiền</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {invoice.items.map((item) => (
                                                <tr key={item.id} className="text-gray-800">
                                                    <td className="py-2 font-medium">{item.item_name}</td>
                                                    <td className="py-2 text-right">{Number(item.quantity)}</td>
                                                    <td className="py-2 text-right font-semibold">{formatCurrency(Number(item.amount))}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="flex justify-between items-center pt-2.5 border-t border-gray-200 font-bold text-sm">
                                        <span className="text-gray-850">Tổng cộng hóa đơn:</span>
                                        <span className="text-primary-600">{formatCurrency(Number(invoice.total_amount))}</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-2 border-t border-gray-150">
                                {invoice.status === "UNPAID" && role === "TENANT" && (
                                    <Button
                                        onClick={() => {
                                            onClose();
                                            navigate("/tenant/payments");
                                        }}
                                        className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs py-1.5 px-3.5 flex items-center gap-1 font-bold shadow-sm"
                                    >
                                        <CreditCard size={12} />
                                        <span>Thanh toán ngay</span>
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        onClose();
                                        navigate(`/${role?.toLowerCase()}/invoices`);
                                    }}
                                    className="rounded-xl text-xs py-1.5 px-3.5 font-medium border-gray-300"
                                >
                                    Quản lý hóa đơn
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-end pt-3 border-t border-gray-100">
                    <Button onClick={onClose} className="rounded-xl px-5 font-semibold">
                        Đóng
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
