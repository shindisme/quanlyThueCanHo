import { useState, useMemo } from "react";
import { Star, Sparkles } from "lucide-react";
import SearchInput from "../../../../components/ui/SearchInput";
import Combobox from "../../../../components/ui/Combobox";
import PageHeader from "../../../../components/layout/PageHeader";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import EmptyState from "../../../../components/ui/EmptyState";
import Button from "../../../../components/ui/Button";
import DefaultPagination from "../../../../components/ui/Pagination";
import { useDebounce } from "../../../../hooks/useDebounce";
import { useSort } from "../../../../hooks/useSort";
import { usePagination } from "../../../../hooks/usePagination";
import { removeVietnameseTones } from "../../../../utils/string";
import { useTenantContracts } from "../hooks/useTenantContracts";
import { useMyReviews } from "../hooks/useContractReview";
import ContractList from "../components/ContractList";
import ContractDocModal from "../../../../components/ContractDocModal";
import ContractReviewModal from "../components/ContractReviewModal";
import ContractTerminationModal from "../components/ContractTerminationModal";
import ContractTerminationCancelDialog from "../components/ContractTerminationCancelDialog";
import {
  CONTRACT_STATUS_CONFIG,
  type ContractStatus,
} from "../../../../constants";
import type { ContractTermination, RentalContract } from "../../../../types";

export default function MyContracts() {
  const { contracts, terminations, isLoading, isError, refetch } = useTenantContracts();
  const { data: myReviews = [] } = useMyReviews();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContractStatus | "">("");
  const [viewContractDoc, setViewContractDoc] = useState<RentalContract | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [terminateContract, setTerminateContract] = useState<RentalContract | null>(null);
  const [cancelTermination, setCancelTermination] = useState<ContractTermination | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const reviewableApartmentIds = useMemo(() => {
    const ids = new Set<number>();
    contracts.forEach((c) => {
      if (c.status === "ENDED" && c.apartment_id) ids.add(c.apartment_id);
    });
    myReviews.forEach((r) => {
      if (r.apartment_id) ids.add(r.apartment_id);
    });
    return Array.from(ids);
  }, [contracts, myReviews]);

  const hasUnreviewedApartment = useMemo(() => {
    if (reviewableApartmentIds.length === 0) return false;
    return reviewableApartmentIds.some(
      (aptId) => !myReviews.some((r) => r.apartment_id === aptId)
    );
  }, [reviewableApartmentIds, myReviews]);

  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      if (statusFilter && c.status !== statusFilter) return false;
      if (!debouncedSearch.trim()) return true;

      const term = removeVietnameseTones(debouncedSearch.toLowerCase());
      const code = `hd-${String(c.id).padStart(5, "0")}`;
      const room = c.apartment?.room_number?.toLowerCase() || "";
      const branch = c.apartment?.building?.branch_name?.toLowerCase() || "";
      return (
        removeVietnameseTones(code).includes(term) ||
        removeVietnameseTones(room).includes(term) ||
        removeVietnameseTones(branch).includes(term)
      );
    });
  }, [contracts, debouncedSearch, statusFilter]);

  // Sorting
  const { items: sortedContracts, requestSort, sortConfig } = useSort<RentalContract>(
    filteredContracts,
    { key: "start_date", direction: "desc" },
    {
      start_date: (c) => (c.start_date ? new Date(c.start_date).getTime() : 0),
      end_date: (c) => (c.end_date ? new Date(c.end_date).getTime() : 0),
      apartment: (c) => c.apartment?.room_number || "",
    }
  );

  // Pagination
  const { currentPage, setCurrentPage, totalPages, startIdx, endIdx } = usePagination({
    totalItems: sortedContracts.length,
    initialPageSize: 10,
  });

  const paginatedContracts = useMemo(() => {
    return sortedContracts.slice(startIdx, endIdx);
  }, [sortedContracts, startIdx, endIdx]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100">
        <LoadingSpinner size={32} />
        <span className="text-sm text-gray-400 mt-2 font-sans">Đang tải danh sách hợp đồng...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        title="Không thể tải hợp đồng"
        description="Đã xảy ra lỗi khi tải dữ liệu hợp đồng. Vui lòng thử lại."
        action={<Button onClick={() => void refetch()}>Tải lại</Button>}
      />
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Hợp đồng thuê phòng"
        subtitle="Danh sách các hợp đồng thuê nhà hiện tại và đã thanh lý"
        count={contracts.length}
        actions={
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {(reviewableApartmentIds.length > 0 || myReviews.length > 0) && (
              <Button
                type="button"
                variant={hasUnreviewedApartment ? "primary" : "outline"}
                onClick={() => setIsReviewModalOpen(true)}
                className={`rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${hasUnreviewedApartment
                  ? "bg-amber-500 hover:bg-amber-600 text-white shadow-xs"
                  : "border-amber-300 bg-amber-50/50 hover:bg-amber-100/70 text-amber-800"
                  }`}
              >
                <Star
                  size={15}
                  className={hasUnreviewedApartment ? "fill-white text-white" : "fill-amber-500 text-amber-500"}
                />
                {hasUnreviewedApartment ? "Đánh giá căn hộ" : "Xem lại đánh giá"}
              </Button>
            )}
            <SearchInput
              value={search}
              onChange={(value) => {
                setSearch(value);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo mã HĐ, phòng, chi nhánh..."
              className="w-full sm:w-64"
            />
          </div>
        }
      />

      {hasUnreviewedApartment && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-linear-to-r from-amber-50/90 to-orange-50/90 border border-amber-200/80 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-amber-950">
                Chia sẻ trải nghiệm thuê phòng của bạn
              </p>
              <p className="text-[11px] sm:text-xs text-amber-800 mt-0.5">
                Bạn có hợp đồng đã hoàn tất. Hãy để lại đánh giá để giúp chúng tôi nâng cao chất lượng dịch vụ nhé!
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setIsReviewModalOpen(true)}
            className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs"
          >
            Đánh giá ngay
          </Button>
        </div>
      )}

      <div className="grid w-full grid-cols-12 gap-3">
        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <Combobox
            options={Object.entries(CONTRACT_STATUS_CONFIG).map(([value, config]) => ({
              value,
              label: config.label,
            }))}
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value as ContractStatus | "");
              setCurrentPage(1);
            }}
            placeholder="Tất cả trạng thái"
            searchable={false}
            className="w-full"
            triggerClassName="h-[40px] border-gray-300 px-3 rounded-xl"
            clearable={true}
          />
        </div>
      </div>

      <div className="space-y-4">
        <ContractList
          contracts={paginatedContracts}
          terminations={terminations}
          onViewContract={setViewContractDoc}
          onOpenTermination={setTerminateContract}
          onCancelTermination={setCancelTermination}
          startIdx={startIdx}
          totalItems={filteredContracts.length}
          sortConfig={sortConfig}
          onSort={(key) => { requestSort(key); setCurrentPage(1); }}
        />

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

      <ContractDocModal
        isOpen={viewContractDoc !== null}
        contract={viewContractDoc}
        onClose={() => setViewContractDoc(null)}
      />

      <ContractReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        contracts={contracts}
        myReviews={myReviews}
      />

      <ContractTerminationModal
        contract={terminateContract}
        onClose={() => setTerminateContract(null)}
      />

      <ContractTerminationCancelDialog
        termination={cancelTermination}
        onClose={() => setCancelTermination(null)}
      />
    </div>
  );
}
