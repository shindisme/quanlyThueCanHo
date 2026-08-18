import { ClipboardList, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../../components/layout/PageHeader";
import SearchInput from "../../../../components/ui/SearchInput";
import Combobox from "../../../../components/ui/Combobox";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import DefaultPagination from "../../../../components/ui/Pagination";
import { useTenantInvoices } from "../hooks/useTenantInvoices";
import InvoiceTable from "../../../../components/invoices/InvoiceList";
import InvoiceDetailModal from "../../../../components/invoices/InvoiceDetailModal";
import { printInvoiceHelper } from "../../../../utils/print";
import { INVOICE_STATUS_OPTIONS, INVOICE_TYPE_OPTIONS } from "../../../../constants";

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
    typeFilter,
    setTypeFilter,

    // Pagination
    currentPage,
    setCurrentPage,
    totalPages,
    startIdx,
    requestSort,
    sortConfig,

    // Details Modal
    selectedInvoice,
    detailsModal,
    handleOpenDetails,
  } = useTenantInvoices();

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Hóa đơn dịch vụ"
        subtitle="Danh sách hóa đơn tiền thuê phòng và phí dịch vụ hàng tháng"
        count={rawInvoicesCount}
        actions={
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Tìm theo mã phòng, mã hóa đơn..."
            className="w-full sm:w-72"
          />
        }
      />

      {/* Filters bar above table */}
      <div className="grid w-full grid-cols-12 gap-3">
        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <Combobox
            options={INVOICE_STATUS_OPTIONS}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Trạng thái"
            searchable={false}
            className="w-full"
            triggerClassName="h-[40px] border-gray-300 px-3 rounded-xl"
            clearable={true}
          />
        </div>
        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <Combobox
            options={INVOICE_TYPE_OPTIONS}
            value={typeFilter}
            onChange={setTypeFilter}
            placeholder="Loại hóa đơn"
            searchable={false}
            className="w-full"
            triggerClassName="h-[40px] border-gray-300 px-3 rounded-xl"
            clearable
          />
        </div>
      </div>

      {/* Main Table Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-75">
          <LoadingSpinner size={36} />
          <span className="text-sm text-gray-400 mt-2">Đang tải hóa đơn...</span>
        </div>
      ) : rawInvoicesCount === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white border border-gray-200 shadow-sm rounded-none">
          <ClipboardList size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Bạn chưa có hóa đơn nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          <InvoiceTable
            invoices={invoices}
            role="TENANT"
            onOpenDetails={handleOpenDetails}
            onPrint={printInvoiceHelper}
            startIdx={startIdx}
            totalItems={rawInvoicesCount}
            sortConfig={sortConfig}
            onSort={(key) => { requestSort(key); setCurrentPage(1); }}
          />

          {invoices.some((inv) => inv.status === "UNPAID" && inv.type !== "REFUND") && (
            <div className="bg-amber-50 border border-amber-200 p-4 shadow-sm rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Wallet className="text-amber-600 shrink-0" size={24} />
                <div>
                  <h4 className="font-bold text-amber-900 text-sm">Bạn có hóa đơn chưa thanh toán</h4>
                  <p className="text-xs text-amber-700 mt-0.5">Vui lòng thanh toán sớm để đảm bảo các dịch vụ không bị gián đoạn.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate("/tenant/payments")}
                className="px-4 py-2 bg-amber-600 text-white font-semibold text-xs hover:bg-amber-700 transition-colors shadow-sm cursor-pointer rounded-lg whitespace-nowrap"
              >
                Tới trang thanh toán
              </button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pt-2">
              <DefaultPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
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
