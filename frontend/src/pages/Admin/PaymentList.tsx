import { CreditCard } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Badge from "../../components/ui/Badge";
import DataTable, { type Column } from "../../components/ui/DataTable";
import { mockPayments } from "../../data/payments";
import { mockInvoices } from "../../data/invoices";
import { mockTenants } from "../../data/tenants";
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS, PAYMENT_METHOD_LABELS } from "../../constants/enums";
import { formatCurrency, formatDateTime } from "../../utils/format";
import type { Payment } from "../../types";
import type { PaymentStatus, PaymentMethod } from "../../constants/enums";

// Trang danh sach thanh toan
export default function PaymentList() {
  const columns: Column<Payment>[] = [
    {
      key: "txn", label: "Ma giao dich",
      render: (p) => <span className="font-medium">{p.transaction_code || "-"}</span>,
    },
    {
      key: "invoice", label: "Hoa don",
      render: (p) => mockInvoices.find((i) => i.id === p.invoice_id)?.invoice_code || "-",
    },
    {
      key: "tenant", label: "Nguoi thue",
      render: (p) => {
        const invoice = mockInvoices.find((i) => i.id === p.invoice_id);
        return mockTenants.find((t) => t.id === invoice?.tenant_id)?.full_name || "-";
      },
    },
    {
      key: "method", label: "Phuong thuc",
      render: (p) => PAYMENT_METHOD_LABELS[p.payment_method as PaymentMethod],
    },
    {
      key: "amount", label: "So tien",
      render: (p) => <span className="font-semibold">{formatCurrency(p.amount)}</span>,
    },
    {
      key: "date", label: "Thoi gian",
      render: (p) => formatDateTime(p.paid_at),
    },
    {
      key: "status", label: "Trang thai",
      render: (p) => (
        <Badge variant={PAYMENT_STATUS_COLORS[p.status as PaymentStatus] as "warning" | "success" | "danger"}>
          {PAYMENT_STATUS_LABELS[p.status as PaymentStatus]}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={CreditCard}
        title="Thanh toán"
        subtitle="Lịch sử giao dịch thanh toán"
        count={mockPayments.length}
        iconColor="linear-gradient(135deg, #10B981, #34D399)"
      />

      <DataTable columns={columns} data={mockPayments} />
    </div>
  );
}
