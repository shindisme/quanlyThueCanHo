import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as paymentService from "../../services/paymentService";
import * as buildingService from "../../services/buildingService";
import { useDebounce } from "../common/useDebounce";
import { usePagination } from "../common/usePagination";
import { useSort } from "../common/useSort";
import { useUserRole } from "../common/useUserRole";
import type { Payment } from "../../types";

export function usePaymentList() {
  const queryClient = useQueryClient();
  const { role, managedBuildingId } = useUserRole();

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [buildingFilter, setBuildingFilter] = useState<number | undefined>(
    role === "MANAGER" ? (managedBuildingId || undefined) : undefined
  );

  const debouncedSearch = useDebounce(search, 300);

  // Load buildings for filter dropdown
  const { data: buildingsRes } = useQuery({
    queryKey: ["buildings"],
    queryFn: () => buildingService.getAllBuildings(),
  });
  const buildings = buildingsRes?.data || [];

  // Fetch payments
  const { data: paymentsRes, isLoading, refetch } = useQuery({
    queryKey: ["payments", statusFilter, methodFilter, buildingFilter, debouncedSearch],
    queryFn: () =>
      paymentService.getAllPayments({
        status: statusFilter || undefined,
        payment_method: methodFilter || undefined,
        building_id: buildingFilter,
        search: debouncedSearch || undefined,
        limit: 100,
      }),
  });
  const payments = paymentsRes?.data || [];

  // Sorting
  const { items: sortedPayments, requestSort, getSortIcon, sortConfig } = useSort<Payment>(payments, {
    key: "paid_at",
    direction: "desc",
  });

  // Pagination
  const { currentPage, setCurrentPage, totalPages, startIdx, endIdx } = usePagination({
    totalItems: sortedPayments.length,
    initialPageSize: 10,
  });

  const paginatedPayments = useMemo(() => {
    return sortedPayments.slice(startIdx, endIdx);
  }, [sortedPayments, startIdx, endIdx]);

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      paymentService.updatePaymentStatus(id, status),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      // Also invalidate invoices in case this marked an invoice as Paid
      queryClient.invalidateQueries({ queryKey: ["invoices"] });

      const statusText = res.status === "SUCCESS" ? "phê duyệt thành công" : "từ chối giao dịch";
      toast.success(`Đã ${statusText}!`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Cập nhật trạng thái giao dịch thất bại");
    },
  });

  const handleApprove = (id: number) => {
    updateStatusMutation.mutate({ id, status: "SUCCESS" });
  };

  const handleReject = (id: number) => {
    updateStatusMutation.mutate({ id, status: "FAILED" });
  };

  return {
    role,
    payments: paginatedPayments,
    rawPaymentsCount: payments.length,
    buildings,
    isLoading,
    isUpdating: updateStatusMutation.isPending,
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
    sortConfig,
    currentPage,
    setCurrentPage,
    totalPages,

    refetch,
  };
}
