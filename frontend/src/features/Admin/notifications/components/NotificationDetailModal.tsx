import { useState, useEffect } from "react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import type { Notification, Invoice } from "../../../../types";
import { formatCurrency } from "../../../../utils/currency";
import { formatDate } from "../../../../utils/date";
import { getAllInvoices } from "../../../../services/invoiceService";
import { FileText, CreditCard, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../../stores/auth.store";

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
    const [invoiceCode, setInvoiceCode] = useState<string | null>(null);
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loadingInvoice, setLoadingInvoice] = useState(false);
    const [showItems, setShowItems] = useState(true);

    const navigate = useNavigate();
    const { role } = useAuthStore();

    useEffect(() => {
        if (isOpen && notification) {
            setInvoice(null);
            setInvoiceCode(null);

            // Match pattern like INV-202607-001 or INV-6-DEP or INV-something
            const text = `${notification.title} ${notification.content}`;
            const match = text.match(/INV-[A-Z0-9_-]+/i);
            if (match) {
                const code = match[0].toUpperCase();
                setInvoiceCode(code);
                loadInvoiceDetails(code);
            }
        }
    }, [isOpen, notification]);

    const loadInvoiceDetails = async (code: string) => {
        setLoadingInvoice(true);
        try {
            const res = await getAllInvoices({ search: code });
            if (res.data && res.data.length > 0) {
                const exact = res.data.find(inv => inv.invoice_code.toUpperCase() === code);
                if (exact) {
                    setInvoice(exact);
                }
            }
        } catch (err) {
            console.error("Error loading invoice for notification:", err);
        } finally {
            setLoadingInvoice(false);
        }
    };

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

                <div className="text-gray-600 leading-relaxed whitespace-pre-wrap py-2 text-sm max-h-62.5 overflow-y-auto">
                    {notification.content}
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
                    <div className="border border-gray-200 rounded-xl bg-gray-50/30 overflow-hidden font-sans mt-3">
                        <div className="bg-gray-100/70 px-4 py-3 flex items-center justify-between border-b border-gray-200">
                            <div className="flex items-center gap-2 font-bold text-gray-800 text-xs uppercase tracking-wider">
                                <FileText size={16} className="text-primary-600" />
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
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-gray-400 block mb-0.5">Căn hộ:</span>
                                    <span className="font-semibold text-gray-800">
                                        P.{invoice.contract?.apartment?.room_number || ""} ({invoice.contract?.apartment?.building?.branch_name || ""})
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
