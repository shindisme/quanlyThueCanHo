import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import * as paymentService from "../../../../services/paymentService";
import * as invoiceService from "../../../../services/invoiceService";
import { useOnOff } from "../../../../hooks/useOnOff";
import { usePagination } from "../../../../hooks/usePagination";
import { useSort } from "../../../../hooks/useSort";
import type { Payment } from "../../../../types";

export function useTenantPayments() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const handledVnpayReturnRef = useRef(false);

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | undefined>(undefined);
  const [paymentMethod, setPaymentMethod] = useState<string>("VNPAY");

  const [transactionCode, setTransactionCode] = useState("");

  const payModal = useOnOff();
  const manualTransferModal = useOnOff();

  useEffect(() => {
    const state = location.state as { invoiceId?: number | string } | null;
    if (state && state.invoiceId) {
      setSelectedInvoiceId(Number(state.invoiceId));
      payModal.onOpen();
    }
  }, [location.state]);

  useEffect(() => {
  if (handledVnpayReturnRef.current || !location.search) {
    return;
  }

  const params = new URLSearchParams(location.search);

  const paymentStatus = (
    params.get("payment_status")
    || params.get("status")
    || ""
  ).toUpperCase();

  if (!paymentStatus) {
    return;
  }

  handledVnpayReturnRef.current = true;

  payModal.onClose();
  manualTransferModal.onClose();
  setSelectedInvoiceId(undefined);

  queryClient.removeQueries({
    queryKey: ["tenant-payments"],
  });

  queryClient.removeQueries({
    queryKey: ["tenant-unpaid-invoices"],
  });

  queryClient.removeQueries({
    queryKey: ["tenant-invoices"],
  });

  queryClient.invalidateQueries();

  if (paymentStatus === "SUCCESS") {
    toast.success("Đã thanh toán thành công");
    } else if (paymentStatus === "CANCELLED") {
      toast.warning("Đã hủy thanh toán");
    } else if (paymentStatus === "PROCESSING") {
      toast.info("Thanh toán đang được xử lý, vui lòng kiểm tra lại sau");
    } else {
      toast.error("Thanh toán không thành công");
    }

  window.history.replaceState(
    {},
    "",
    location.pathname
  );
}, [
  location.pathname,
  location.search,
  queryClient,
  payModal,
  manualTransferModal,
]);

  // Fetch unpaid invoices for payment selection
  const { data: unpaidInvoicesRes, isLoading: loadingInvoices } = useQuery({
    queryKey: ["tenant-unpaid-invoices"],
    queryFn: () => invoiceService.getAllInvoices({ status: "UNPAID", limit: 100 }),
  });
  const unpaidInvoices = unpaidInvoicesRes?.data || [];

  // Fetch payment transactions history
  const { data: paymentsRes, isLoading: loadingPayments } = useQuery({
    queryKey: ["tenant-payments"],
    queryFn: () => paymentService.getAllPayments({ limit: 100 }),
  });
  const payments = paymentsRes?.data || [];

  // Sort payment history
  const { items: sortedPayments, requestSort, getSortIcon, sortConfig } = useSort<Payment>(payments, {
    key: "paid_at",
    direction: "desc",
  });

  // Paginate payments
  const { currentPage, setCurrentPage, totalPages, startIdx, endIdx } = usePagination({
    totalItems: sortedPayments.length,
    initialPageSize: 10,
  });

  const paginatedPayments = useMemo(() => {
    return sortedPayments.slice(startIdx, endIdx);
  }, [sortedPayments, startIdx, endIdx]);

  // Calculate outstanding balance
  const outstandingBalance = useMemo(() => {
    return unpaidInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
  }, [unpaidInvoices]);

  // Mutations
  const payVNPayMutation = useMutation({
    mutationFn: (payload: paymentService.CreateVnpayPaymentPayload) =>
      paymentService.createVnpayPayment(payload),
    onSuccess: (res) => {
      toast.loading("Đang chuyển hướng tới cổng thanh toán VNPay...");
      if (res.paymentUrl) {
        window.location.href = res.paymentUrl;
      } else {
        toast.error("Không nhận được URL thanh toán từ cổng VNPay");
      }
    },
    onError: (error: unknown) => {
      const err = error as { message?: string };
      toast.error(err.message || "Tạo liên kết thanh toán VNPay thất bại");
    },
  });

  const payManualMutation = useMutation({
    mutationFn: (payload: paymentService.CreatePaymentPayload) =>
      paymentService.createPayment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-payments"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-unpaid-invoices"] });
      toast.success("Gửi thông tin giao dịch thành công! Chờ quản lý phê duyệt.");
      manualTransferModal.onClose();
      payModal.onClose();
      // Reset form
      setTransactionCode("");
    },
    onError: (error: unknown) => {
      const err = error as { message?: string };
      toast.error(err.message || "Gửi thông tin giao dịch thất bại");
    },
  });

  const handleStartPayment = (invoiceId: number) => {
    setSelectedInvoiceId(invoiceId);
    payModal.onOpen();
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId) return;

    if (paymentMethod === "VNPAY") {
      payVNPayMutation.mutate({ invoice_id: selectedInvoiceId });
    } else if (paymentMethod === "BANK_TRANSFER") {
      // upload transaction code
      manualTransferModal.onOpen();
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId || !transactionCode.trim()) return;

    const targetInvoice = unpaidInvoices.find((inv) => inv.id === selectedInvoiceId);
    if (!targetInvoice) return;

    payManualMutation.mutate({
      invoice_id: selectedInvoiceId,
      payment_method: "BANK_TRANSFER",
      transaction_code: transactionCode.trim(),
      amount: Number(targetInvoice.total_amount),
      status: "PENDING",
    });
  };

  return {
    unpaidInvoices,
    payments: paginatedPayments,
    rawPaymentsCount: payments.length,
    outstandingBalance,
    isLoading: loadingInvoices || loadingPayments,
    isProcessing: payVNPayMutation.isPending || payManualMutation.isPending,

    // Payment process
    selectedInvoiceId,
    setSelectedInvoiceId,
    paymentMethod,
    setPaymentMethod,
    transactionCode,
    setTransactionCode,
    payModal,
    manualTransferModal,
    handleStartPayment,
    handleConfirmPayment,
    handleManualSubmit,

    // Sorting and Pagination
    requestSort,
    getSortIcon,
    sortConfig,
    currentPage,
    setCurrentPage,
    totalPages,
  };
}
