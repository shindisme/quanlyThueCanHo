import { FileText, ClipboardList, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../../components/PageHeader";
import SearchInput from "../../../../components/ui/SearchInput";
import Combobox from "../../../../components/ui/Combobox";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import DefaultPagination from "../../../../components/ui/Pagination";
import { useTenantInvoices } from "../hooks/useTenantInvoices";
import InvoiceTable from "../../../Admin/invoices/components/InvoiceList";
import InvoiceDetailModal from "../../../Admin/invoices/components/InvoiceDetailModal";
import { printInvoiceHelper } from "../../../../utils/print";

export default function MyInvoices() {
  const navigate = useNavigate();
  const {
    invoices,
    rawInvoicesCount,
    isLoading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,

    // Pagination
    currentPage,
    setCurrentPage,
    totalPages,

    // Details Modal
    selectedInvoice,
    detailsModal,
    handleOpenDetails,
  } = useTenantInvoices();


  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        icon={FileText}
        title="Hóa đơn của tôi"
        subtitle="Theo dõi lịch sử hóa đơn dịch vụ, tiền nhà hàng tháng và các khoản đã thanh toán"
        count={rawInvoicesCount}
        iconColor="linear-gradient(135deg, #3B82F6, #1D4ED8)"
      />

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Tìm hóa đơn theo mã phòng..."
          className="flex-1"
        />

        <Combobox
          options={[
            { value: "", label: "Tất cả trạng thái" },
            { value: "PAID", label: "Đã thanh toán" },
            { value: "UNPAID", label: "Chưa thanh toán" },
            { value: "OVERDUE", label: "Quá hạn" }
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="Trạng thái"
          searchable={false}
          triggerClassName="h-[42px] border-gray-300 px-3 rounded-xl min-w-[160px]"
          clearable={true}
        />
      </div>

      {/* Main Table Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <LoadingSpinner size={36} />
          <span className="text-sm text-gray-400 mt-2">Đang tải hóa đơn...</span>
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white border border-gray-200 shadow-md rounded-none">
          <ClipboardList size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Bạn chưa có hóa đơn nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          <InvoiceTable
            invoices={invoices}
            role="TENANT"
            onOpenDetails={handleOpenDetails}
            onToggleStatus={() => { }}
            onPrint={printInvoiceHelper}
          />

          {invoices.some((inv) => inv.status === "UNPAID") && (
            <div className="bg-amber-50 border border-amber-200 p-4 shadow-md rounded-none flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Wallet className="text-amber-600 shrink-0" size={24} />
                <div>
                  <h4 className="font-bold text-amber-850 text-sm">Bạn có hóa đơn chưa thanh toán</h4>
                  <p className="text-xs text-amber-700 mt-0.5">Vui lòng thanh toán sớm để đảm bảo các dịch vụ không bị gián đoạn.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate("/tenant/payments")}
                className="px-4 py-2 bg-amber-600 text-white font-semibold text-xs hover:bg-amber-700 transition-colors shadow-sm cursor-pointer rounded-none whitespace-nowrap"
              >
                Tới trang thanh toán
              </button>
            </div>
          )}

          {/* Pagination */}
          <div className="pt-2">
            <DefaultPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}

      {/* Details Modal */}
      <InvoiceDetailModal
        isOpen={detailsModal.isOpen}
        onClose={detailsModal.onClose}
        invoice={selectedInvoice}
      />
    </div>
  );
}
