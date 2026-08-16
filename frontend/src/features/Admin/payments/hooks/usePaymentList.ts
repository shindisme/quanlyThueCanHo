import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as paymentService from "../../../../services/paymentService";
import * as buildingService from "../../../../services/buildingService";
import * as apartmentService from "../../../../services/apartmentService";
import { useDebounce } from "../../../../hooks/useDebounce";
import { usePagination } from "../../../../hooks/usePagination";
import { useSort } from "../../../../hooks/useSort";
import { useUserRole } from "../../../../hooks/useUserRole";
import { getInvoiceApartment, getInvoiceRoomDisplay, getInvoiceTenant } from "../../../../utils/invoiceDisplay";
import type { Payment, Apartment, PaymentMethod, PaymentStatus } from "../../../../types";
import { queryKeys } from "../../../../constants/queryKeys";

export interface PaymentFiltersState {
  search: string;
  status: PaymentStatus | "";
  method: PaymentMethod | "";
  buildingId?: number;
  floor: string;
  month: string;
}

export function usePaymentList() {
  const queryClient = useQueryClient();
  const { role, managedBuildingId } = useUserRole();

  // Grouped filters state
  const [filters, setFilters] = useState<PaymentFiltersState>({
    search: "",
    status: "",
    method: "",
    buildingId: role === "MANAGER" ? (managedBuildingId || undefined) : undefined,
    floor: "",
    month: "",
  });

  const debouncedSearch = useDebounce(filters.search, 300);

  const updateFilter = <K extends keyof PaymentFiltersState>(key: K, value: PaymentFiltersState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const { data: buildings = [] } = useQuery({
    queryKey: queryKeys.buildings.all,
    queryFn: () => buildingService.getAllPage(),
    select: (res) => res.data,
  });

  const { data: apartments = [] } = useQuery({
    queryKey: queryKeys.apartments.all,
    queryFn: () => apartmentService.getAllPage(),
    select: (res) => res.data as Apartment[],
  });

  const availableFloors = useMemo(() => {
    const targetBuildingId = role === "MANAGER" ? managedBuildingId : filters.buildingId;
    const apts = targetBuildingId
      ? apartments.filter((a) => a.building_id === targetBuildingId)
      : apartments;
    const floors = Array.from(new Set(apts.map((a) => a.floor))).sort((a, b) => a - b);
    return floors;
  }, [apartments, filters.buildingId, role, managedBuildingId]);

  // Fetch payments
  const { data: payments = [], isLoading } = useQuery({
    queryKey: queryKeys.payments.list({
      status: filters.status,
      method: filters.method,
      buildingId: filters.buildingId,
      search: debouncedSearch,
    }),
    queryFn: () =>
      paymentService.getAllPage({
        status: filters.status || undefined,
        payment_method: filters.method || undefined,
        building_id: filters.buildingId,
        search: debouncedSearch || undefined,
      }),
    select: (res) => res.data,
  });

  const filteredPayments = useMemo(() => {
    return payments.filter((pmt) => {
      if (filters.floor) {
        const apt = pmt.invoice ? getInvoiceApartment(pmt.invoice) : null;
        if (!apt || apt.floor !== Number(filters.floor)) return false;
      }

      if (filters.month) {
        const pmtDateStr = pmt.paid_at;
        if (!pmtDateStr) return false;
        const dateObj = new Date(pmtDateStr);
        if (isNaN(dateObj.getTime())) return false;
        const pmtMonth = dateObj.getMonth() + 1;
        if (pmtMonth !== Number(filters.month)) return false;
      }

      return true;
    });
  }, [payments, filters.floor, filters.month]);

  // Sắp xếp
  const paymentSortExtractors = useMemo(() => ({
    room: (payment: Payment) => payment.invoice ? getInvoiceRoomDisplay(payment.invoice).room : "",
    tenant: (payment: Payment) => payment.invoice ? getInvoiceTenant(payment.invoice)?.full_name ?? "" : "",
  }), []);

  const { items: sortedPayments, requestSort, getSortIcon, sortConfig } = useSort<Payment>(filteredPayments, {
    key: "paid_at",
    direction: "desc",
  }, paymentSortExtractors);

  // Pagination
  const { currentPage, setCurrentPage, totalPages, startIdx, endIdx } = usePagination({
    totalItems: sortedPayments.length,
    initialPageSize: 10,
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filters.status, filters.method, filters.buildingId, filters.floor, filters.month, setCurrentPage]);

  const paginatedPayments = useMemo(() => {
    return sortedPayments.slice(startIdx, endIdx);
  }, [sortedPayments, startIdx, endIdx]);

  const handleUpdateStatusPayment = useMutation({
    mutationFn: ({ id, status }: { id: number; status: PaymentStatus }) =>
      paymentService.updateStatus(id, status),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });

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

    filters,
    updateFilter,
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
    startIdx,
  };
}
