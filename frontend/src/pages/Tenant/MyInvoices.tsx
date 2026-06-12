import { useState } from "react";
import Card from "../../components/common/ui/Card";
import Badge from "../../components/common/ui/Badge";
import Button from "../../components/common/ui/Button";
import Modal from "../../components/common/ui/Modal";
import { useAuthStore } from "../../stores/auth.store";
import { mockInvoices } from "../../data/invoices";
import { mockInvoiceItems } from "../../data/invoices";
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from "../../constants/enums";
import { formatCurrency, formatDate } from "../../utils/format";
import type { Invoice } from "../../types";
import type { InvoiceStatus } from "../../constants/enums";
import { Receipt, CreditCard, Eye } from "lucide-react";
import { toast } from "sonner";

// Trang hoa don cua nguoi thue
// Hien thi hoa don thang nay va lich su hoa don
export default function TenantInvoices() {
  const { user } = useAuthStore();
  const tenantId = user?.id ? user.id - 3 : 1;
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Lay hoa don cua nguoi thue
  const invoices = mockInvoices.filter((inv) => inv.tenant_id === tenantId);
  const unpaidInvoices = invoices.filter((inv) => inv.status === "UNPAID" || inv.status === "OVERDUE");
  const paidInvoices = invoices.filter((inv) => inv.status === "PAID");

  // Lay chi tiet hoa don
  function getInvoiceItems(invoiceId: number) {
    return mockInvoiceItems.filter((item) => item.invoice_id === invoiceId);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Hoa don cua toi</h1>
        <p className="text-sm text-gray-500">Xem va thanh toan hoa don tien thue</p>
      </div>

      {/* Hoa don chua thanh toan */}
      {unpaidInvoices.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Chua thanh toan</h3>
          <div className="space-y-3">
            {unpaidInvoices.map((inv) => (
              <Card
                key={inv.id}
                className={`border-l-4 ${
                  inv.status === "OVERDUE" ? "border-l-danger-500" : "border-l-warning-500"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      inv.status === "OVERDUE" ? "bg-danger-50" : "bg-warning-50"
                    }`}>
                      <Receipt size={22} className={
                        inv.status === "OVERDUE" ? "text-danger-500" : "text-warning-600"
                      } />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{inv.invoice_code}</p>
                      <p className="text-xs text-gray-400">Han thanh toan: {formatDate(inv.due_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-800">{formatCurrency(inv.total_amount)}</p>
                      <Badge variant={INVOICE_STATUS_COLORS[inv.status as InvoiceStatus] as "warning" | "danger"}>
                        {INVOICE_STATUS_LABELS[inv.status as InvoiceStatus]}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setSelectedInvoice(inv)}>
                        <Eye size={14} /> Chi tiet
                      </Button>
                      <Button size="sm" onClick={() => toast.success("Chuyen huong den trang thanh toan...")}>
                        <CreditCard size={14} /> Thanh toan
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Hoa don da thanh toan */}
      {paidInvoices.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Da thanh toan</h3>
          <div className="space-y-3">
            {paidInvoices.map((inv) => (
              <Card key={inv.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-success-50 rounded-xl flex items-center justify-center">
                      <Receipt size={22} className="text-success-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{inv.invoice_code}</p>
                      <p className="text-xs text-gray-400">Thanh toan: {formatDate(inv.paid_at || "")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-800">{formatCurrency(inv.total_amount)}</p>
                      <Badge variant="success">Da thanh toan</Badge>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedInvoice(inv)}>
                      <Eye size={14} />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {invoices.length === 0 && (
        <Card>
          <p className="text-center text-gray-400 py-8">Ban chua co hoa don nao</p>
        </Card>
      )}

      {/* Modal chi tiet hoa don */}
      <Modal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        title={`Chi tiet ${selectedInvoice?.invoice_code || ""}`}
        size="md"
      >
        {selectedInvoice && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="text-sm text-gray-500">Han thanh toan</span>
              <span className="text-sm font-medium">{formatDate(selectedInvoice.due_date)}</span>
            </div>

            {/* Danh sach hang muc */}
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-2">Chi tiet</p>
              <div className="space-y-2">
                {getInvoiceItems(selectedInvoice.id).map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                    <div>
                      <p className="text-sm text-gray-700">{item.item_name}</p>
                      {item.description && (
                        <p className="text-xs text-gray-400">{item.description}</p>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-800">{formatCurrency(item.amount)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tong cong */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <span className="font-semibold text-gray-800">Tong cong</span>
              <span className="text-xl font-bold text-primary-600">
                {formatCurrency(selectedInvoice.total_amount)}
              </span>
            </div>

            {/* Trang thai */}
            <div className="flex justify-center">
              <Badge variant={INVOICE_STATUS_COLORS[selectedInvoice.status as InvoiceStatus] as "success" | "warning" | "danger"}>
                {INVOICE_STATUS_LABELS[selectedInvoice.status as InvoiceStatus]}
              </Badge>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
