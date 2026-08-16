import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { queryKeys } from "../../../../constants/queryKeys";
import { useDebounce } from "../../../../hooks/useDebounce";
import { usePagination } from "../../../../hooks/usePagination";
import { useSort } from "../../../../hooks/useSort";
import * as invoiceService from "../../../../services/invoiceService";
import * as paymentService from "../../../../services/paymentService";
import type { Payment } from "../../../../types";
import { getApiErrorMessage } from "../../../../utils/apiError";
import { getInvoiceRoomDisplay, getInvoiceStatus, hideInvoicesCoveredByFinalSettlement } from "../../../../utils/invoiceDisplay";
import { resolvePaymentReturnStatus, type PaymentReturnStatus } from "../../../../utils/paymentReturn";

const PAYMENT_SORT_EXTRACTORS = {
  room: (payment: Payment) => payment.invoice ? getInvoiceRoomDisplay(payment.invoice).room : "",
};

function notifyPaymentReturn(status: PaymentReturnStatus) {
  if (status === "SUCCESS") toast.success("Đã thanh toán thành công");
  else if (status === "CANCELLED") toast.warning("Đã hủy thanh toán");
  else if (status === "PROCESSING") toast.info("Thanh toán đang được xử lý, vui lòng kiểm tra lại sau");
  else toast.error("Thanh toán không thành công");
}

export function useTenantPayments() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const handledVnpayReturnRef = useRef(false);
  const handledNavigationStateRef = useRef(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const invoicesQuery = useQuery({
    queryKey: queryKeys.invoices.tenantList({ paymentStatus: "outstanding" }),
    queryFn: () => invoiceService.getAllPage(),
  });
  const unpaidInvoices = useMemo(() => {
    return hideInvoicesCoveredByFinalSettlement(invoicesQuery.data?.data || [])
      .filter((invoice) => getInvoiceStatus(invoice) !== "PAID")
      .filter((invoice) => Number(invoice.remaining_amount ?? invoice.total_amount) > 0)
      .sort((a, b) => {
        const aStatus = getInvoiceStatus(a);
        const bStatus = getInvoiceStatus(b);
        if (aStatus !== bStatus) return aStatus === "OVERDUE" ? -1 : 1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });
  }, [invoicesQuery.data?.data]);

  const paymentsQuery = useQuery({
    queryKey: queryKeys.payments.tenantList(),
    queryFn: () => paymentService.getAllPage(),
  });
  const filteredPayments = useMemo(() => {
    const keyword = debouncedSearch.trim().toLowerCase();
    return (paymentsQuery.data?.data || []).filter((payment) => {
      if (statusFilter && payment.status !== statusFilter) return false;
      if (methodFilter && payment.payment_method !== methodFilter) return false;
      if (!keyword) return true;
      const room = payment.invoice ? getInvoiceRoomDisplay(payment.invoice) : null;
      return [payment.transaction_code, payment.invoice?.invoice_code, room?.room, room?.branch]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [debouncedSearch, methodFilter, paymentsQuery.data?.data, statusFilter]);

  const { items: sortedPayments, requestSort, sortConfig } = useSort<Payment>(
    filteredPayments,
    { key: "paid_at", direction: "desc" },
    PAYMENT_SORT_EXTRACTORS
  );
  const { currentPage, setCurrentPage, totalPages, startIdx, endIdx } = usePagination({
    totalItems: sortedPayments.length,
    initialPageSize: 10,
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, methodFilter, setCurrentPage, statusFilter]);

  const payVNPayMutation = useMutation({
    mutationFn: paymentService.createVnpayPayment,
    onSuccess: (result) => {
      if (!result.paymentUrl) {
        toast.error("Không nhận được URL thanh toán từ cổng VNPay");
        return;
      }
      window.location.assign(result.paymentUrl);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Tạo liên kết thanh toán VNPay thất bại"));
    },
  });

  const handleStartPayment = useCallback((invoiceId: number) => {
    if (payVNPayMutation.isPending) return;
    const invoice = unpaidInvoices.find((item) => item.id === invoiceId);
    if (!invoice) {
      toast.warning("Hóa đơn không còn khả dụng để thanh toán");
      return;
    }
    payVNPayMutation.mutate({ invoice_id: invoiceId });
  }, [payVNPayMutation, unpaidInvoices]);

  useEffect(() => {
    if (handledNavigationStateRef.current || invoicesQuery.isLoading) return;
    const state = location.state as { invoiceId?: number | string } | null;
    if (!state?.invoiceId) return;

    handledNavigationStateRef.current = true;
    const invoiceId = Number(state.invoiceId);
    const invoice = unpaidInvoices.find((item) => item.id === invoiceId);
    if (invoice) {
      handleStartPayment(invoiceId);
    } else {
      toast.warning("Hóa đơn không còn khả dụng để thanh toán");
    }
    void navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
  }, [handleStartPayment, invoicesQuery.isLoading, location.pathname, location.search, location.state, navigate, unpaidInvoices]);

  useEffect(() => {
    if (handledVnpayReturnRef.current || !location.search) return;
    const params = new URLSearchParams(location.search);
    const responseStatus = params.get("payment_status");
    if (!responseStatus) return;

    handledVnpayReturnRef.current = true;
    const verifyReturn = async () => {
      const paymentId = Number(params.get("payment_id"));
      let payment: Payment | null = null;
      if (Number.isInteger(paymentId) && paymentId > 0) {
        try {
          payment = await paymentService.getById(paymentId);
        } catch {
          // Trạng thái URL không được coi là thành công nếu API chưa xác minh được.
        }
      }

      const status = resolvePaymentReturnStatus(
        responseStatus,
        params.get("response_code"),
        payment
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.payments.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all }),
      ]);
      notifyPaymentReturn(status);
      void navigate(location.pathname, { replace: true, state: null });
    };

    void verifyReturn();
  }, [location.pathname, location.search, navigate, queryClient]);

  return {
    unpaidInvoices,
    payments: sortedPayments.slice(startIdx, endIdx),
    rawPaymentsCount: filteredPayments.length,
    outstandingBalance: unpaidInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.remaining_amount ?? invoice.total_amount),
      0
    ),
    isLoading: invoicesQuery.isLoading || paymentsQuery.isLoading,
    error: invoicesQuery.error || paymentsQuery.error,
    refetch: async () => {
      await Promise.all([invoicesQuery.refetch(), paymentsQuery.refetch()]);
    },
    isProcessing: payVNPayMutation.isPending,
    processingInvoiceId: payVNPayMutation.variables?.invoice_id,
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
  };
}
