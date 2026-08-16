import { useState } from "react";
import PageHeader from "../../../../components/layout/PageHeader";
import Button from "../../../../components/ui/Button";
import Combobox from "../../../../components/ui/Combobox";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import DefaultPagination from "../../../../components/ui/Pagination";
import SearchInput from "../../../../components/ui/SearchInput";
import { getMonthOptions } from "../../../../utils/date";
import UtilityReadingList from "../components/UtilityReadingList";
import UtilityReadingDetailModal from "../components/UtilityReadingDetailModal";
import { useTenantUtilities } from "../hooks/useTenantUtilities";
import type { UtilityReadingData } from "../../../../types";

export default function MyUtilities() {
  const utilities = useTenantUtilities();
  const [detailReading, setDetailReading] = useState<UtilityReadingData | null>(null);

  if (utilities.isLoading) {
    return (
      <div className="flex min-h-100 flex-col items-center justify-center">
        <LoadingSpinner size={36} />
        <span className="mt-2 text-sm text-gray-400">Đang tải lịch sử chỉ số điện nước...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Điện & Nước"
        subtitle="Theo dõi chỉ số và lịch sử tiêu thụ điện nước"
        count={utilities.readingCount}
        actions={
          <SearchInput value={utilities.search} onChange={utilities.setSearch} placeholder="Kỳ ghi, người ghi..." className="w-full sm:w-64" />
        }
      />

      <div className="grid w-full grid-cols-12 gap-3">
        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <Combobox className="w-full" options={getMonthOptions()} value={utilities.monthFilter} onChange={utilities.setMonthFilter} placeholder="Tháng" searchable={false} clearable />
        </div>
        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <Combobox className="w-full" options={utilities.yearOptions} value={utilities.yearFilter} onChange={utilities.setYearFilter} placeholder="Năm" searchable={false} clearable />
        </div>
      </div>

      {utilities.error ? (
        <div className="border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
          <p>Không thể tải lịch sử điện nước.</p>
          <Button variant="outline" onClick={() => void utilities.refetch()} className="mt-3">Thử lại</Button>
        </div>
      ) : (
        <UtilityReadingList
          readings={utilities.readings}
          startIdx={utilities.startIdx}
          totalItems={utilities.readingCount}
          sortConfig={utilities.sortConfig}
          onSort={(key) => { utilities.requestSort(key); utilities.setCurrentPage(1); }}
          onView={setDetailReading}
        />
      )}

      {utilities.totalPages > 1 && (
        <DefaultPagination currentPage={utilities.currentPage} totalPages={utilities.totalPages} onPageChange={utilities.setCurrentPage} />
      )}
      <UtilityReadingDetailModal reading={detailReading} onClose={() => setDetailReading(null)} />
    </div>
  );
}
