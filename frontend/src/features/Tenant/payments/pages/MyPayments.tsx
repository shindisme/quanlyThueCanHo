import { useState } from "react";
import { History } from "lucide-react";
import PageHeader from "../../../../components/layout/PageHeader";
import Combobox from "../../../../components/ui/Combobox";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import DefaultPagination from "../../../../components/ui/Pagination";
import SearchInput from "../../../../components/ui/SearchInput";
import Button from "../../../../components/ui/Button";
import { PAYMENT_METHOD_OPTIONS, PAYMENT_STATUS_OPTIONS } from "../../../../constants";
import PaymentDetailModal from "../../../../components/payments/PaymentDetailModal";
import PaymentList from "../../../../components/payments/PaymentList";
import type { Payment } from "../../../../types";
import OutstandingInvoices from "../components/OutstandingInvoices";
import { useTenantPayments } from "../hooks/useTenantPayments";

export default function MyPayments() {
  const [detailPayment, setDetailPayment] = useState<Payment | null>(null);
  const {
    unpaidInvoices,
    payments,
    rawPaymentsCount,
    outstandingBalance,
    isLoading,
    isProcessing,
    processingInvoiceId,
    error,
    refetch,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    methodFilter,
    setMethodFilter,
    handleStartPayment,
    requestSort,
    sortConfig,
    currentPage,
    setCurrentPage,
    totalPages,
    startIdx,
  } = useTenantPayments();

  return (
    <div className="space-y-8 font-sans">
      <PageHeader
        title="Thanh toán"
        subtitle="Theo dõi dư nợ, thanh toán hóa đơn và tra cứu lịch sử giao dịch"
      />

      {isLoading ? (
        <div className="flex min-h-75 flex-col items-center justify-center">
          <LoadingSpinner size={36} />
          <span className="mt-2 text-sm text-gray-400">Đang tải thông tin thanh toán...</span>
        </div>
      ) : error ? (
        <div className="border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">
          <p>Không thể tải thông tin thanh toán.</p>
          <Button variant="outline" onClick={() => void refetch()} className="mt-3">Thử lại</Button>
        </div>
      ) : (
        <>
          <OutstandingInvoices
            invoices={unpaidInvoices}
            outstandingBalance={outstandingBalance}
            onPay={handleStartPayment}
            isProcessing={isProcessing}
            processingInvoiceId={processingInvoiceId}
          />

          <section className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-800">
                  <History size={16} className="text-gray-500" />
                  Lịch sử giao dịch
                </h3>
                <p className="mt-1 text-xs text-gray-400">{rawPaymentsCount} giao dịch phù hợp</p>
              </div>
              <div className="grid w-full grid-cols-12 gap-3 lg:max-w-4xl">
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
                  <SearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder="Mã giao dịch, mã hóa đơn..."
                    className="w-full"
                  />
                </div>
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
                  <Combobox
                    options={PAYMENT_STATUS_OPTIONS}
                    value={statusFilter}
                    onChange={setStatusFilter}
                    placeholder="Trạng thái"
                    searchable={false}
                    className="w-full"
                    clearable
                  />
                </div>
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
                  <Combobox
                    options={PAYMENT_METHOD_OPTIONS}
                    value={methodFilter}
                    onChange={setMethodFilter}
                    placeholder="Phương thức"
                    searchable={false}
                    className="w-full"
                    clearable
                  />
                </div>
              </div>
            </div>

            <PaymentList
              payments={payments}
              role="TENANT"
              startIdx={startIdx}
              totalItems={rawPaymentsCount}
              onViewDetail={setDetailPayment}
              sortConfig={sortConfig}
              onSort={(key) => { requestSort(key); setCurrentPage(1); }}
            />

            {totalPages > 1 && (
              <DefaultPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </section>
        </>
      )}

      <PaymentDetailModal
        isOpen={Boolean(detailPayment)}
        onClose={() => setDetailPayment(null)}
        payment={detailPayment}
        showPayer={false}
      />
    </div>
  );
}
