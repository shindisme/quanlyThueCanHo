import { useState } from "react";
import { CreditCard, ClipboardList } from "lucide-react";
import PageHeader from "../../../../components/PageHeader";
import SearchInput from "../../../../components/ui/SearchInput";
import Combobox from "../../../../components/ui/Combobox";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import DefaultPagination from "../../../../components/ui/Pagination";
import PaymentList from "../components/PaymentList";
import PaymentDetailModal from "../components/PaymentDetailModal";
import { usePaymentList } from "../hooks/usePaymentList";
import type { Payment } from "../../../../types";

export default function PaymentPage() {
  const [viewItem, setViewItem] = useState<Payment | null>(null);
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
    selectedFloor,
    setSelectedFloor,
    selectedMonth,
    setSelectedMonth,
    availableFloors,
    handleApprove,
    handleReject,
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

      <div className="flex flex-col gap-3 w-full">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              options={(buildings as any[]).map((b) => ({ value: String(b.id), label: b.branch_name }))}
              value={buildingFilter ? String(buildingFilter) : ""}
              onChange={(val) => {
                setBuildingFilter(val ? Number(val) : undefined);
                setSelectedFloor("");
              }}
              placeholder="Tất cả tòa nhà"
              triggerClassName="h-[42px] rounded-none border-gray-300 px-3 rounded-xl"
              clearable={true}
            />
          )}

          {role === "ADMIN" && (
            <Combobox
              options={availableFloors.map((fl) => ({ value: String(fl), label: `Tầng ${fl}` }))}
              value={selectedFloor}
              onChange={setSelectedFloor}
              placeholder="Tất cả tầng"
              triggerClassName="h-[42px] rounded-none border-gray-300 px-3 rounded-xl"
              clearable={true}
            />
          )}

          {role === "MANAGER" && (
            <Combobox
              options={[
                { value: "1", label: "Tháng 1" },
                { value: "2", label: "Tháng 2" },
                { value: "3", label: "Tháng 3" },
                { value: "4", label: "Tháng 4" },
                { value: "5", label: "Tháng 5" },
                { value: "6", label: "Tháng 6" },
                { value: "7", label: "Tháng 7" },
                { value: "8", label: "Tháng 8" },
                { value: "9", label: "Tháng 9" },
                { value: "10", label: "Tháng 10" },
                { value: "11", label: "Tháng 11" },
                { value: "12", label: "Tháng 12" },
              ]}
              value={selectedMonth}
              onChange={setSelectedMonth}
              placeholder="Tất cả tháng"
              triggerClassName="h-[42px] rounded-none border-gray-300 px-3 rounded-xl"
              clearable={true}
            />
          )}
        </div>
      </div>

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
            onViewDetail={(pmt) => setViewItem(pmt)}
          />
          <div className="pt-2">
            <DefaultPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        </div>
      )}

      <PaymentDetailModal
        isOpen={!!viewItem}
        onClose={() => setViewItem(null)}
        payment={viewItem}
      />
    </div>
  );
}
