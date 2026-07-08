import { FileText, Plus, ClipboardList } from "lucide-react";
import PageHeader from "../../../components/PageHeader";
import SearchInput from "../../../components/ui/SearchInput";
import Combobox from "../../../components/ui/Combobox";
import Button from "../../../components/ui/Button";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import DefaultPagination from "../../../components/ui/Pagination";
import { useInvoiceList } from "../../../hooks/admin/useInvoiceList";
import InvoiceTable from "./components/InvoiceList";
import InvoiceDetailModal from "./components/InvoiceDetailModal";
import InvoiceGenerateModal from "./components/InvoiceGenerateModal";
import { printInvoiceHelper } from "../../../utils/print";

export default function InvoiceList() {
  const {
    role,
    managedBuildingId,
    invoices,
    rawInvoicesCount,
    buildings,
    isLoading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    buildingFilter,
    setBuildingFilter,
    monthFilter,
    setMonthFilter,
    yearFilter,
    setYearFilter,

    // Sorting
    requestSort,
    getSortIcon,

    // Pagination
    currentPage,
    setCurrentPage,
    totalPages,

    // Details Modal
    selectedInvoice,
    detailsModal,
    handleOpenDetails,

    // Generate Modal
    generateModal,
    generateInvoices,
    isGenerating,

    // Status Toggle
    handleToggleStatus,
  } = useInvoiceList();

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = currentYear - 2 + i;
    return { value: String(y), label: `Năm ${y}` };
  });

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: `Tháng ${i + 1}`,
  }));

  // Handle setting month filter
  const handleMonthChange = (val: string) => {
    if (!val) {
      setMonthFilter(undefined);
      setYearFilter(undefined); // Month and Year must be set together
    } else {
      setMonthFilter(Number(val));
      if (!yearFilter) {
        setYearFilter(currentYear); // default year if not selected
      }
    }
  };

  const handleYearChange = (val: string) => {
    if (!val) {
      setYearFilter(undefined);
      setMonthFilter(undefined); // Month and Year must be set together
    } else {
      setYearFilter(Number(val));
      if (!monthFilter) {
        setMonthFilter(new Date().getMonth() + 1); // default month if not selected
      }
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        icon={FileText}
        title="Quản lý hóa đơn"
        subtitle="Theo dõi công nợ, tính tiền dịch vụ hàng tháng và kiểm soát trạng thái thanh toán"
        count={rawInvoicesCount}
        iconColor="linear-gradient(135deg, #10B981, #3B82F6)"
        actions={
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Tìm theo mã HD, số phòng, tên khách thuê..."
              className="w-64 sm:w-80 flex-1 min-w-0"
            />
            {(role === "ADMIN" || role === "MANAGER") && (
              <Button
                onClick={generateModal.onOpen}
                className="flex items-center gap-2 rounded-xl shrink-0 shadow-md font-semibold"
              >
                <Plus size={16} />
                <span>Tính tiền tháng này</span>
              </Button>
            )}
          </div>
        }
      />

      {/* Filters bar */}
      <div className="flex flex-col gap-3 w-full">

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Combobox
            options={[
              { value: "PAID", label: "Đã thanh toán" },
              { value: "UNPAID", label: "Chưa thanh toán" },
              { value: "OVERDUE", label: "Quá hạn" },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Trạng thái"
            searchable={false}
            triggerClassName="h-[42px] rounded-none border-gray-300 px-3 rounded-xl rounded-xl"
            clearable={true}
          />

          <Combobox
            options={monthOptions}
            value={monthFilter ? String(monthFilter) : ""}
            onChange={handleMonthChange}
            placeholder="Tháng"
            searchable={false}
            triggerClassName="h-[42px] rounded-none border-gray-300 px-3 rounded-xl rounded-xl"
            clearable={true}
          />

          <Combobox
            options={yearOptions}
            value={yearFilter ? String(yearFilter) : ""}
            onChange={handleYearChange}
            placeholder="Năm"
            searchable={false}
            triggerClassName="h-[42px] rounded-none border-gray-300 px-3 rounded-xl"
            clearable={true}
          />

          {role === "ADMIN" && (
            <Combobox
              options={buildings.map((b) => ({ value: String(b.id), label: b.branch_name }))}
              value={buildingFilter ? String(buildingFilter) : ""}
              onChange={(val) => setBuildingFilter(val ? Number(val) : undefined)}
              placeholder="Tất cả chi nhánh"
              triggerClassName="h-[42px] rounded-none border-gray-300 px-3 rounded-xl"
              clearable={true}
            />
          )}
        </div>
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
          <p className="font-medium">Không tìm thấy hóa đơn nào phù hợp bộ lọc</p>
        </div>
      ) : (
        <div className="space-y-4">
          <InvoiceTable
            invoices={invoices}
            role={role}
            onOpenDetails={handleOpenDetails}
            onToggleStatus={handleToggleStatus}
            onPrint={printInvoiceHelper}
            getSortIcon={getSortIcon}
            requestSort={requestSort}
          />

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

      {/* Generation Modal */}
      <InvoiceGenerateModal
        isOpen={generateModal.isOpen}
        onClose={generateModal.onClose}
        buildings={buildings}
        isGenerating={isGenerating}
        onGenerate={generateInvoices}
        role={role}
        managedBuildingId={managedBuildingId}
      />
    </div>
  );
}
