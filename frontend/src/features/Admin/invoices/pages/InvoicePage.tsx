import { ClipboardList, ExternalLink, Plus } from "lucide-react";
import PageHeader from "../../../../components/layout/PageHeader";
import SearchInput from "../../../../components/ui/SearchInput";
import Combobox from "../../../../components/ui/Combobox";
import Button from "../../../../components/ui/Button";
import Modal from "../../../../components/ui/Modal";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import DefaultPagination from "../../../../components/ui/Pagination";
import { useInvoiceList } from "../hooks/useInvoiceList";
import { useDepositInvoice } from "../hooks/useDepositInvoice";
import InvoiceTable from "../../../../components/invoices/InvoiceList";
import InvoiceDetailModal from "../../../../components/invoices/InvoiceDetailModal";
import InvoiceGenerateModal from "../components/InvoiceGenerateModal";
import DepositInvoiceModal from "../components/DepositInvoiceModal";
import { printInvoiceHelper } from "../../../../utils/print";
import { INVOICE_STATUS_OPTIONS, INVOICE_TYPE_OPTIONS } from "../../../../constants";

export default function InvoicePage() {
  const {
    role,
    managedBuildingId,
    invoices,
    rawInvoicesCount,
    buildings,
    isLoading,
    isError,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    buildingFilter,
    setBuildingFilter,
    monthFilter,
    setMonthFilter,
    yearFilter,
    setYearFilter,
    currentPage,
    setCurrentPage,
    totalPages,
    startIdx,
    requestSort,
    sortConfig,
    selectedInvoice,
    detailsModal,
    handleOpenDetails,
    vnpayQrModal,
    vnpayQrPayment,
    handleCloseVnpayQr,
    generateModal,
    generateInvoices,
    isGenerating,
    handleConfirmCashPayment,
    handleCreateVnpayQr,
    refetch,
  } = useInvoiceList();

  const canManageDeposits = role === "ADMIN" || role === "MANAGER";
  const vnpayQrImageSrc = vnpayQrPayment?.qrCodeDataUrl
    || (vnpayQrPayment?.qrCodeSvg
      ? `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(vnpayQrPayment.qrCodeSvg)}`
      : "");

  const openVnpayPaymentPage = () => {
    if (!vnpayQrPayment?.paymentUrl) return;
    window.open(vnpayQrPayment.paymentUrl, "_blank", "noopener,noreferrer");
  };
  const depositModal = useDepositInvoice({
    role,
    managedBuildingId: managedBuildingId ?? undefined,
    onSuccessCallback: refetch,
  });

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = currentYear - 2 + i;
    return { value: String(y), label: `Năm ${y}` };
  });

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: `Tháng ${i + 1}`,
  }));

  const handleMonthChange = (val: string) => {
    if (!val) {
      setMonthFilter(undefined);
      setYearFilter(undefined);
    } else {
      setMonthFilter(Number(val));
      if (!yearFilter) {
        setYearFilter(currentYear);
      }
    }
  };

  const handleYearChange = (val: string) => {
    if (!val) {
      setYearFilter(undefined);
      setMonthFilter(undefined);
    } else {
      setYearFilter(Number(val));
      if (!monthFilter) {
        setMonthFilter(new Date().getMonth() + 1);
      }
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Quản lý hóa đơn"
        subtitle="Theo dõi công nợ, tính tiền dịch vụ hằng tháng và kiểm soát trạng thái thanh toán"
        count={rawInvoicesCount}
        actions={
          <div className="flex flex-col gap-2.5 w-full sm:w-auto items-stretch sm:items-end">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Tìm theo mã HD, số phòng, tên người thuê..."
              className="w-full sm:w-80"
            />
            {canManageDeposits && (
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => depositModal.openModal()}
                  className="h-9 rounded-xl justify-center shadow-xs font-semibold text-xs sm:text-sm px-3.5 whitespace-nowrap"
                >
                  <span>Lập hóa đơn cọc</span>
                </Button>
                <Button
                  type="button"
                  onClick={generateModal.onOpen}
                  className="h-9 rounded-xl justify-center shadow-xs font-semibold text-xs sm:text-sm px-3.5 whitespace-nowrap"
                >
                  <Plus size={15} className="mr-1" />
                  <span>Tạo hóa đơn hàng tháng</span>
                </Button>
              </div>
            )}
          </div>
        }
      />

      <div className={`grid w-full grid-cols-1 gap-3 sm:grid-cols-2 ${role === "ADMIN" ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
        <div className="min-w-0">
          <Combobox
            options={INVOICE_STATUS_OPTIONS}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Trạng thái"
            searchable={false}
            className="w-full"
            triggerClassName="h-[42px] border-gray-300 px-3 rounded-xl"
            clearable={true}
          />
        </div>

        <div className="min-w-0">
          <Combobox
            options={INVOICE_TYPE_OPTIONS}
            value={typeFilter}
            onChange={setTypeFilter}
            placeholder="Loại hóa đơn"
            searchable={false}
            className="w-full"
            triggerClassName="h-[42px] border-gray-300 px-3 rounded-xl"
            clearable={true}
          />
        </div>

        <div className="min-w-0">
          <Combobox
            options={monthOptions}
            value={monthFilter ? String(monthFilter) : ""}
            onChange={handleMonthChange}
            placeholder="Tháng"
            searchable={false}
            className="w-full"
            triggerClassName="h-[42px] border-gray-300 px-3 rounded-xl"
            clearable={true}
          />
        </div>

        <div className="min-w-0">
          <Combobox
            options={yearOptions}
            value={yearFilter ? String(yearFilter) : ""}
            onChange={handleYearChange}
            placeholder="Năm"
            searchable={false}
            className="w-full"
            triggerClassName="h-[42px] border-gray-300 px-3 rounded-xl"
            clearable={true}
          />
        </div>

        {role === "ADMIN" && (
          <div className="min-w-0">
            <Combobox
              options={buildings.map((b) => ({ value: String(b.id), label: b.branch_name }))}
              value={buildingFilter ? String(buildingFilter) : ""}
              onChange={(val) => setBuildingFilter(val ? Number(val) : undefined)}
              placeholder="Chi nhánh"
              className="w-full"
              triggerClassName="h-[42px] border-gray-300 px-3 rounded-xl"
              clearable={true}
            />
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-75">
          <LoadingSpinner size={36} />
          <span className="text-sm text-gray-400 mt-2">Đang tải hóa đơn...</span>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center gap-3 border border-red-200 bg-red-50 py-12 text-center text-red-700">
          <p className="font-medium">Không thể tải danh sách hóa đơn.</p>
          <Button type="button" variant="outline" onClick={() => void refetch()}>
            Thử lại
          </Button>
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white border border-gray-200 shadow-md rounded-none">
          <ClipboardList size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Không tìm thấy hóa đơn nào phù hợp bộ lọc</p>
        </div>
      ) : (
        <div className="space-y-4">
          <InvoiceTable
            invoices={invoices}
            role={role}
            onOpenDetails={handleOpenDetails}
            onConfirmCashPayment={handleConfirmCashPayment}
            onCreateVnpayQr={handleCreateVnpayQr}
            onPrint={printInvoiceHelper}
            startIdx={startIdx}
            totalItems={rawInvoicesCount}
            sortConfig={sortConfig}
            onSort={(key) => { requestSort(key); setCurrentPage(1); }}
          />

          <div className="pt-2">
            <DefaultPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        </div>
      )}

      <InvoiceDetailModal isOpen={detailsModal.isOpen} onClose={detailsModal.onClose} invoice={selectedInvoice} />

      <Modal
        isOpen={vnpayQrModal.isOpen}
        onClose={handleCloseVnpayQr}
        title="QR thanh toán VNPay"
        size="sm"
        footer={
          <>
            <Button type="button" variant="outline" onClick={handleCloseVnpayQr}>
              Đóng
            </Button>
            <Button type="button" onClick={openVnpayPaymentPage} disabled={!vnpayQrPayment?.paymentUrl}>
              <ExternalLink size={16} />
              Mở trang VNPay
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-center">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {vnpayQrPayment?.invoice.invoice_code || "Hóa đơn"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Khách hàng quét mã để thanh toán qua VNPay
            </p>
          </div>

          {vnpayQrImageSrc ? (
            <div className="mx-auto w-72 max-w-full border border-gray-200 bg-white p-4 shadow-sm">
              <img
                src={vnpayQrImageSrc}
                alt="QR thanh toán VNPay"
                className="h-auto w-full"
              />
            </div>
          ) : (
            <p className="text-sm text-red-600">Không có mã QR thanh toán.</p>
          )}
        </div>
      </Modal>
      <InvoiceGenerateModal
        isOpen={generateModal.isOpen}
        onClose={generateModal.onClose}
        buildings={buildings}
        isGenerating={isGenerating}
        onGenerate={generateInvoices}
        role={role}
        managedBuildingId={managedBuildingId}
      />

      <DepositInvoiceModal controller={depositModal} />
    </div>
  );
}
