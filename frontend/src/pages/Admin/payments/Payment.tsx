import { CreditCard, ClipboardList } from "lucide-react";
import PageHeader from "../../../components/PageHeader";
import SearchInput from "../../../components/ui/SearchInput";
import Combobox from "../../../components/ui/Combobox";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import DefaultPagination from "../../../components/ui/Pagination";
import PaymentList from "./components/PaymentList";
import { usePaymentList } from "../../../hooks/admin/usePaymentList";

export default function Payment() {
  const {
    role,
    payments,
    rawPaymentsCount,
    buildings,
    isLoading,
    isUpdating,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    methodFilter,
    setMethodFilter,
    buildingFilter,
    setBuildingFilter,

    // Actions
    handleApprove,
    handleReject,

    // Sorting & Pagination
    requestSort,
    getSortIcon,
    currentPage,
    setCurrentPage,
    totalPages,
  } = usePaymentList();

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        icon={CreditCard}
        title="Quản lý giao dịch"
        subtitle="Theo dõi lịch sử thanh toán hóa đơn, kiểm tra mã đối chiếu và phê duyệt các giao dịch chuyển khoản thủ công"
        count={rawPaymentsCount}
        iconColor="linear-gradient(135deg, #8B5CF6, #EC4899)"
        actions={
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Tìm theo mã giao dịch, mã hóa đơn, tên khách thuê..."
            className="w-64 sm:w-80 flex-1 min-w-0"
          />
        }
      />

      {/* Filters bar */}
      <div className="flex flex-col gap-3 w-full">

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <Combobox
            options={[
              { value: "SUCCESS", label: "Thành công" },
              { value: "PENDING", label: "Chưa thanh toán" },
              { value: "FAILED", label: "Thất bại" },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Trạng thái"
            searchable={false}
            triggerClassName="h-[42px] rounded-none border-gray-300 px-3 rounded-xl"
            clearable={true}
          />

          <Combobox
            options={[
              { value: "BANK_TRANSFER", label: "Chuyển khoản" },
              { value: "E_WALLET", label: "VNPay" },
            ]}
            value={methodFilter}
            onChange={setMethodFilter}
            placeholder="Phương thức"
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

      {/* Main Table Ledger */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-75">
          <LoadingSpinner size={36} />
          <span className="text-sm text-gray-400 mt-2">Đang tải lịch sử giao dịch...</span>
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white border border-gray-200 shadow-md rounded-none">
          <ClipboardList size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Không tìm thấy giao dịch nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          <PaymentList
            payments={payments}
            role={role}
            isUpdating={isUpdating}
            handleApprove={handleApprove}
            handleReject={handleReject}
            requestSort={requestSort}
            getSortIcon={getSortIcon}
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
    </div>
  );
}
