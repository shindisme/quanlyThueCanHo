import { useState } from "react";
import { ClipboardList } from "lucide-react";
import PageHeader from "../../../../components/layout/PageHeader";
import SearchInput from "../../../../components/ui/SearchInput";
import Combobox from "../../../../components/ui/Combobox";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import DefaultPagination from "../../../../components/ui/Pagination";
import PaymentList from "../../../../components/payments/PaymentList";
import PaymentDetailModal from "../../../../components/payments/PaymentDetailModal";
import { usePaymentList } from "../hooks/usePaymentList";
import { PAYMENT_STATUS_OPTIONS, PAYMENT_METHOD_OPTIONS } from "../../../../constants";
import type { Payment, PaymentMethod, PaymentStatus } from "../../../../types";

export default function PaymentPage() {
  const [viewItem, setViewItem] = useState<Payment | null>(null);
  const {
    role,
    payments,
    rawPaymentsCount,
    buildings,
    isLoading,
    isUpdating,
    filters,
    updateFilter,
    availableFloors,
    handleApprove,
    handleReject,
    currentPage,
    setCurrentPage,
    totalPages,
    startIdx,
    requestSort,
    sortConfig,
  } = usePaymentList();

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Quản lý giao dịch"
        subtitle="Theo dõi lịch sử thanh toán hóa đơn, kiểm tra mã đối chiếu và phê duyệt các giao dịch chuyển khoản thủ công"
        count={rawPaymentsCount}
        actions={
          <SearchInput
            value={filters.search}
            onChange={(val) => updateFilter("search", val)}
            placeholder="Tìm theo mã giao dịch, mã hóa đơn, tên khách thuê..."
            className="w-full min-w-0 flex-1 sm:w-80"
          />
        }
      />

      <div className="grid grid-cols-12 gap-3 w-full">
        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <Combobox
            options={PAYMENT_STATUS_OPTIONS}
            value={filters.status}
            onChange={(val) => updateFilter("status", val as PaymentStatus | "")}
            placeholder="Trạng thái"
            searchable={false}
            className="w-full"
            triggerClassName="h-[42px] rounded-xl border-gray-300 px-3"
            clearable={true}
          />
        </div>

        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <Combobox
            options={PAYMENT_METHOD_OPTIONS}
            value={filters.method}
            onChange={(val) => updateFilter("method", val as PaymentMethod | "")}
            placeholder="Phương thức"
            searchable={false}
            className="w-full"
            triggerClassName="h-[42px] rounded-xl border-gray-300 px-3"
            clearable={true}
          />
        </div>

        {role === "ADMIN" && (
          <div className="col-span-12 sm:col-span-6 md:col-span-3">
            <Combobox
              options={buildings.map((b) => ({ value: String(b.id), label: b.branch_name }))}
              value={filters.buildingId ? String(filters.buildingId) : ""}
              onChange={(val) => {
                updateFilter("buildingId", val ? Number(val) : undefined);
                updateFilter("floor", "");
              }}
              placeholder="Tất cả tòa nhà"
              className="w-full"
              triggerClassName="h-[42px] rounded-xl border-gray-300 px-3"
              clearable={true}
            />
          </div>
        )}

        {role === "ADMIN" && (
          <div className="col-span-12 sm:col-span-6 md:col-span-3">
            <Combobox
              options={availableFloors.map((fl) => ({ value: String(fl), label: `Tầng ${fl}` }))}
              value={filters.floor}
              onChange={(val) => updateFilter("floor", val)}
              placeholder="Tất cả tầng"
              className="w-full"
              triggerClassName="h-[42px] rounded-xl border-gray-300 px-3"
              clearable={true}
            />
          </div>
        )}

        {role === "MANAGER" && (
          <div className="col-span-12 sm:col-span-6 md:col-span-3">
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
              value={filters.month}
              onChange={(val) => updateFilter("month", val)}
              placeholder="Tất cả tháng"
              className="w-full"
              triggerClassName="h-[42px] rounded-xl border-gray-300 px-3"
              clearable={true}
            />
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-75">
          <LoadingSpinner size={36} />
          <span className="text-sm text-gray-400 mt-2">Đang tải lịch sử giao dịch...</span>
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white border border-gray-200 shadow-sm rounded-none">
          <ClipboardList size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Không tìm thấy giao dịch nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          <PaymentList
            payments={payments}
            role={role}
            isUpdating={isUpdating}
            startIdx={startIdx}
            totalItems={rawPaymentsCount}
            handleApprove={handleApprove}
            handleReject={handleReject}
            onViewDetail={(pmt) => setViewItem(pmt)}
            sortConfig={sortConfig}
            onSort={(key) => { requestSort(key); setCurrentPage(1); }}
          />
          <div className="pt-2">
            <DefaultPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        </div>
      )}

      <PaymentDetailModal
        isOpen={Boolean(viewItem)}
        onClose={() => setViewItem(null)}
        payment={viewItem}
      />
    </div>
  );
}
