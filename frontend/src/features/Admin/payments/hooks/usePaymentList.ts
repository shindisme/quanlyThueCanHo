import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as paymentService from "../../../../services/paymentService";
import * as buildingService from "../../../../services/buildingService";
import * as apartmentService from "../../../../services/apartmentService";
import { useDebounce } from "../../../../hooks/useDebounce";
import { usePagination } from "../../../../hooks/usePagination";
import { useSort } from "../../../../hooks/useSort";
import { useUserRole } from "../../../../hooks/useUserRole";
import { getInvoiceApartment } from "../../../../utils/invoiceDisplay";
import type { Payment } from "../../../../types";

export function usePaymentList() {
  const queryClient = useQueryClient();
  const { role, managedBuildingId } = useUserRole();

  // Lọc
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [buildingFilter, setBuildingFilter] = useState<number | undefined>(
    role === "MANAGER" ? (managedBuildingId || undefined) : undefined
  );
  const [selectedFloor, setSelectedFloor] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  const debouncedSearch = useDebounce(search, 300);

  const { data: buildings = [] } = useQuery({
    queryKey: ["buildings"],
    queryFn: () => buildingService.getAllPage(),
    select: (res) => res.data,
  });

  const { data: apartments = [] } = useQuery({
    queryKey: ["apartments"],
    queryFn: () => apartmentService.getAllPage(),
    select: (res) => res.data,
  });

  const availableFloors = useMemo(() => {
    const targetBuildingId = role === "MANAGER" ? managedBuildingId : buildingFilter;
    const apts = targetBuildingId
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (apartments as any[]).filter((a) => a.building_id === targetBuildingId)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      : (apartments as any[]);
    const floors = Array.from(new Set(apts.map((a) => a.floor))).sort((a, b) => a - b);
    return floors;
  }, [apartments, buildingFilter, role, managedBuildingId]);

  // Fetch payments
  const { data: paymentsRes, isLoading, refetch } = useQuery({
    queryKey: ["payments", statusFilter, methodFilter, buildingFilter, debouncedSearch],
    queryFn: () =>
      paymentService.getAll({
        status: statusFilter || undefined,
        payment_method: methodFilter || undefined,
        building_id: buildingFilter,
        search: debouncedSearch || undefined,
        limit: 100,
      }),
  });
  const payments = paymentsRes?.data || [];

  const filteredPayments = useMemo(() => {
    return payments.filter((pmt) => {
      // 1. Lọc theo Tầng
      if (selectedFloor) {
        const apt = pmt.invoice ? getInvoiceApartment(pmt.invoice) : null;
        if (!apt || apt.floor !== Number(selectedFloor)) return false;
      }

      // 2. Lọc theo Tháng
      if (selectedMonth) {
        const pmtDateStr = pmt.paid_at;
        if (!pmtDateStr) return false;
        const pmtMonth = new Date(pmtDateStr).getMonth() + 1;
        if (pmtMonth !== Number(selectedMonth)) return false;
      }

      return true;
    });
  }, [payments, selectedFloor, selectedMonth]);

  // Sắp xếp
  const { items: sortedPayments, requestSort, getSortIcon, sortConfig } = useSort<Payment>(filteredPayments, {
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

  // Tạo 
  const handleUpdateStatusPayment = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      paymentService.updateStatus(id, status),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });

      const statusText = res.status === "SUCCESS" ? "phê duyệt thành công" : "từ chối giao dịch";
      toast.success(`Đã ${statusText}!`);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Cập nhật trạng thái giao dịch thất bại");
    },
  });

  const handleApprove = (id: number) => {
    handleUpdateStatusPayment.mutate({ id, status: "SUCCESS" });
  };

  const handleReject = (id: number) => {
    handleUpdateStatusPayment.mutate({ id, status: "FAILED" });
  };

  return {
    role,
    payments: paginatedPayments,
    rawPaymentsCount: payments.length,
    buildings,
    isLoading,
    isUpdating: handleUpdateStatusPayment.isPending,

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

    // Sắp xếp và pagination
    requestSort,
    getSortIcon,
    sortConfig,
    currentPage,
    setCurrentPage,
    totalPages,

    refetch,
  };
}
