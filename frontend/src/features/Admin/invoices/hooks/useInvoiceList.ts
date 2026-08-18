import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as invoiceService from "../../../../services/invoiceService";
import * as buildingService from "../../../../services/buildingService";
import * as reservationService from "../../../../services/reservationService";
import * as paymentService from "../../../../services/paymentService";
import { useDebounce } from "../../../../hooks/useDebounce";
import { useOnOff } from "../../../../hooks/useOnOff";
import { usePagination } from "../../../../hooks/usePagination";
import { useUserRole } from "../../../../hooks/useUserRole";
import { useSort } from "../../../../hooks/useSort";
import type { Invoice } from "../../../../types";
import type { InvoicePersistedStatus, InvoiceType } from "../../../../constants";
import { getInvoiceRoomDisplay, getInvoiceStatus, getInvoiceTenant, getInvoiceType, isRefundInvoice } from "../../../../utils/invoiceDisplay";
import { getInvoicePeriodSortValue } from "../../../../utils/invoicePeriod";
import { queryKeys } from "../../../../constants/queryKeys";
import { getApiErrorMessage } from "../../../../utils/apiError";

type VnpayQrPayment = paymentService.CreateVnpayPaymentResult & {
  invoice: Invoice;
};

// Helper lọc hóa đơn theo bộ lọc
export function filterInvoices(
  invoices: Invoice[],
  filters: {
    statusFilter?: string;
    typeFilter?: string;
    buildingFilter?: number;
    monthFilter?: number;
    yearFilter?: number;
    debouncedSearch?: string;
  }
): Invoice[] {
  let result = invoices;

  if (filters.statusFilter) {
    result = result.filter((inv) => getInvoiceStatus(inv) === filters.statusFilter);
  }
  if (filters.typeFilter) {
    result = result.filter((inv) => getInvoiceType(inv) === filters.typeFilter);
  }
  if (filters.buildingFilter) {
    result = result.filter((inv) => {
      const apt = inv.contract?.apartment || inv.reservation?.apartment;
      return apt ? Number(apt.building_id) === Number(filters.buildingFilter) : false;
    });
  }
  if (filters.monthFilter || filters.yearFilter) {
    result = result.filter((inv) => {
      const d = new Date(inv.created_at || inv.due_date);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      if (filters.monthFilter && m !== filters.monthFilter) return false;
      if (filters.yearFilter && y !== filters.yearFilter) return false;
      return true;
    });
  }
  if (filters.debouncedSearch) {
    const s = filters.debouncedSearch.toLowerCase();
    result = result.filter((inv) => {
      const code = inv.invoice_code?.toLowerCase() || "";
      const tenantName = (
        inv.contract?.tenant?.full_name ||
        inv.tenant?.full_name ||
        inv.reservation?.tenant?.full_name ||
        ""
      ).toLowerCase();
      const room = (
        inv.contract?.apartment?.room_number ||
        inv.reservation?.apartment?.room_number ||
        ""
      ).toLowerCase();
      return code.includes(s) || tenantName.includes(s) || room.includes(s);
    });
  }

  return result;
}

export function useInvoiceList() {
  const queryClient = useQueryClient();
  const { role, managedBuildingId } = useUserRole();

  // Tự động kiểm tra và xoá các khoản cọc giữ phòng hết hạn khi mount
  useEffect(() => {
    reservationService.expireReservations().then((res) => {
      if (res.data?.expired_count && res.data.expired_count > 0) {
        toast.info(`Hệ thống đã tự động hủy giữ phòng và gửi Email thông báo cho ${res.data.expired_count} cọc đã quá hạn.`);
        void queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
        void queryClient.invalidateQueries({ queryKey: queryKeys.apartments.all });
      }
    }).catch(() => {
      /*empty*/
    });
  }, [queryClient]);

  // State lọc
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [buildingFilter, setBuildingFilter] = useState<number | undefined>(
    role === "MANAGER" ? (managedBuildingId || undefined) : undefined
  );
  const [monthFilter, setMonthFilter] = useState<number | undefined>(undefined);
  const [yearFilter, setYearFilter] = useState<number | undefined>(undefined);

  const debouncedSearch = useDebounce(search, 300);

  const detailsModal = useOnOff();
  const generateModal = useOnOff();
  const vnpayQrModal = useOnOff();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [vnpayQrPayment, setVnpayQrPayment] = useState<VnpayQrPayment | null>(null);

  // Danh sách tòa nhà
  const { data: buildings = [] } = useQuery({
    queryKey: queryKeys.buildings.all,
    queryFn: () => buildingService.getAllPage(),
    select: (res) => res.data,
  });

  // Tải danh sách hóa đơn
  const loadInvoices = async () => {
    const hasCompletePeriod = monthFilter !== undefined && yearFilter !== undefined;
    const res = await invoiceService.getAllPage({
      status: statusFilter && statusFilter !== "OVERDUE"
        ? statusFilter as InvoicePersistedStatus
        : undefined,
      type: typeFilter ? typeFilter as InvoiceType : undefined,
      building_id: buildingFilter,
      month: hasCompletePeriod ? monthFilter : undefined,
      year: hasCompletePeriod ? yearFilter : undefined,
      search: debouncedSearch || undefined,
    });

    const baseInvoices = filterInvoices(res.data || [], {
      statusFilter,
      typeFilter,
      buildingFilter,
      monthFilter,
      yearFilter,
      debouncedSearch,
    });

    return { data: baseInvoices };
  };

  const { data: invoicesRes, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.invoices.list({
      role,
      managedBuildingId,
      statusFilter,
      typeFilter,
      buildingFilter,
      monthFilter,
      yearFilter,
      search: debouncedSearch,
    }),
    queryFn: loadInvoices,
    select: (res) => res.data,
  });

  const invoices = invoicesRes || [];

  // Sắp xếp
  const invoiceSortExtractors = useMemo(() => ({
    room: (invoice: Invoice) => getInvoiceRoomDisplay(invoice).room,
    tenant: (invoice: Invoice) => getInvoiceTenant(invoice)?.full_name ?? "",
    period: getInvoicePeriodSortValue,
  }), []);

  const { items: sortedInvoices, requestSort, getSortIcon, sortConfig } = useSort<Invoice>(invoices, {
    key: "created_at",
    direction: "desc",
  }, invoiceSortExtractors);

  // Phân trang
  const { currentPage, setCurrentPage, totalPages, startIdx, endIdx } = usePagination({
    totalItems: sortedInvoices.length,
    initialPageSize: 10,
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, typeFilter, buildingFilter, monthFilter, yearFilter, setCurrentPage]);

  const paginatedInvoices = useMemo(() => {
    return sortedInvoices.slice(startIdx, endIdx);
  }, [sortedInvoices, startIdx, endIdx]);

  // Mutation tạo hóa đơn
  const handleGenerateInvoice = useMutation({
    mutationFn: (payload: invoiceService.GenerateMonthlyInvoicesPayload) =>
      invoiceService.generateMonthlyInvoices(payload),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
      toast.success(res.message || "Tạo hóa đơn thành công!");
      generateModal.onClose();
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Tạo hóa đơn thất bại"));
    },
  });

  // Mutation tạo liên kết thanh toán VNPay
  const handleCreateVnpayQr = useMutation({
    mutationFn: async (invoice: Invoice) =>
      paymentService.createVnpayPayment({ invoice_id: invoice.id }),
    onSuccess: (res, invoice) => {
      if (!res.qrCodeDataUrl && !res.qrCodeSvg) {
        toast.error("Không nhận được mã QR thanh toán từ cổng VNPay");
        return;
      }

      setVnpayQrPayment({ ...res, invoice });
      vnpayQrModal.onOpen();
      toast.success("Đã tạo mã QR thanh toán VNPay");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error(err.response?.data?.message || err.message || "Tạo mã QR thanh toán VNPay thất bại");
    },
  });

  // Mutation xác nhận thanh toán tiền mặt hoặc hoàn cọc
  const handleConfirmCashPayment = useMutation({
    mutationFn: async (invoice: Invoice) => {
      if (isRefundInvoice(invoice)) {
        return invoiceService.updateStatus(invoice.id, "PAID");
      }

      return paymentService.create({
        invoice_id: invoice.id,
        payment_method: "CASH",
        status: "SUCCESS",
      });
    },
    onSuccess: async (_result, invoice) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.payments.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all }),
      ]);
      toast.success(isRefundInvoice(invoice) ? "Đã xác nhận hoàn cọc!" : "Đã xác nhận thanh toán tiền mặt!");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Xác nhận thanh toán thất bại");
    },
  });

  const handleOpenDetails = useCallback((invoice: Invoice) => {
    setSelectedInvoice(invoice);
    detailsModal.onOpen();
  }, [detailsModal]);

  const handleCloseVnpayQr = useCallback(() => {
    vnpayQrModal.onClose();
    setVnpayQrPayment(null);
  }, [vnpayQrModal]);

  const handleCreateVnpayQrClick = useCallback((invoice: Invoice) => {
    if (invoice.status === "PAID") return;
    handleCreateVnpayQr.mutate(invoice);
  }, [handleCreateVnpayQr]);

  const handleConfirmCashPaymentClick = useCallback((invoice: Invoice) => {
    if (invoice.status === "PAID") return;
    handleConfirmCashPayment.mutate(invoice);
  }, [handleConfirmCashPayment]);

  return {
    role,
    managedBuildingId,
    invoices: paginatedInvoices,
    rawInvoicesCount: invoices.length,
    buildings,
    isLoading,
    isError,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    buildingFilter,
    setBuildingFilter,
    monthFilter,
    setMonthFilter,
    yearFilter,
    setYearFilter,

    // Sort
    requestSort,
    getSortIcon,
    sortConfig,

    // Pagination
    currentPage,
    setCurrentPage,
    totalPages,
    startIdx,

    // Details Modal
    selectedInvoice,
    detailsModal,
    handleOpenDetails,
    vnpayQrModal,
    vnpayQrPayment,
    handleCloseVnpayQr,

    // Generate Modal
    generateModal,
    generateInvoices: handleGenerateInvoice.mutate,
    isGenerating: handleGenerateInvoice.isPending,

    // VNPay QR creation
    handleCreateVnpayQr: handleCreateVnpayQrClick,
    isCreatingVnpayQr: handleCreateVnpayQr.isPending,

    // Cash payment confirmation
    handleConfirmCashPayment: handleConfirmCashPaymentClick,
    isUpdatingStatus: handleConfirmCashPayment.isPending,

    refetch,
  };
}
