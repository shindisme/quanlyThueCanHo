import { useState, useMemo, useEffect } from "react";
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

export function useInvoiceList() {
  const queryClient = useQueryClient();
  const { role, managedBuildingId } = useUserRole();

  useEffect(() => {
    reservationService.expireReservations().then((res) => {
      if (res.data?.expired_count && res.data.expired_count > 0) {
        toast.info(`Hệ thống đã tự động hủy giữ phòng và gửi Email thông báo cho ${res.data.expired_count} cọc đã quá hạn.`);
        queryClient.invalidateQueries({ queryKey: ["invoices"] });
        queryClient.invalidateQueries({ queryKey: ["apartments"] });
      }
    }).catch(() => {
      // Bỏ qua lỗi ngầm
    });
  }, [queryClient]);

  // State lọc
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [buildingFilter, setBuildingFilter] = useState<number | undefined>(
    role === "MANAGER" ? (managedBuildingId || undefined) : undefined
  );

  // lọc tháng, năm 
  const [monthFilter, setMonthFilter] = useState<number | undefined>(undefined);
  const [yearFilter, setYearFilter] = useState<number | undefined>(undefined);

  const debouncedSearch = useDebounce(search, 300);

  const detailsModal = useOnOff();
  const generateModal = useOnOff();

  // Chọn hóa đơn
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Lấy danh sách chi nhánh để lọc và chọn
  const { data: buildings = [] } = useQuery({
    queryKey: ["buildings"],
    queryFn: () => buildingService.getAllBuildingsPage(),
    select: (res) => res.data,
  });

  // Load invoices
  const { data: invoicesRes, isLoading, refetch } = useQuery({
    queryKey: ["invoices", role, managedBuildingId, statusFilter, buildingFilter, monthFilter, yearFilter, debouncedSearch],
    queryFn: async () => {
      const res = await invoiceService.getAllInvoicesPage({
        status: statusFilter || undefined,
        building_id: buildingFilter,
        month: monthFilter,
        year: yearFilter,
        search: debouncedSearch || undefined,
      });

      const baseInvoices = res.data || [];

      if (role !== "MANAGER") {
        return { data: baseInvoices };
      }

      try {
        const [paymentsRes, reservationsRes] = await Promise.all([
          paymentService.getAllPaymentsPage().catch(() => ({ data: [] })),
          reservationService.getReservations({ limit: 100 }).catch(() => ({ data: [] })),
        ]);

        const depositInvoicesFromPayments: Invoice[] = (paymentsRes.data || [])
          .map((p) => p.invoice)
          .filter((inv): inv is Invoice => !!inv && (inv.type === "DEPOSIT" || !!inv.reservation_id || inv.invoice_code?.startsWith("DEP-")));

        const reservations = reservationsRes.data || [];

        const existingDepositCodes = new Set(
          [...baseInvoices, ...depositInvoicesFromPayments].map((inv) => inv.invoice_code)
        );

        const syntheticDepositInvoices: Invoice[] = reservations
          .filter((resv) => !existingDepositCodes.has(`DEP-${resv.id}`))
          .map((resv) => {
            const isPaid = resv.status === "CONVERTED";
            const isForfeited = resv.status === "FORFEITED" || resv.status === "CANCELLED";
            const invStatus = isPaid ? "PAID" : isForfeited ? "OVERDUE" : "UNPAID";

            return {
              id: resv.id,
              invoice_code: `DEP-${resv.id}`,
              type: "DEPOSIT",
              tenant_id: resv.tenant_id,
              contract_id: null,
              reservation_id: resv.id,
              due_date: resv.expires_at || resv.created_at,
              total_amount: resv.deposit_amount,
              paid_amount: isPaid ? resv.deposit_amount : 0,
              remaining_amount: isPaid ? 0 : resv.deposit_amount,
              status: invStatus,
              created_at: resv.created_at || resv.reserved_at,
              updated_at: resv.created_at || resv.reserved_at,
              tenant: resv.tenant
                ? {
                  id: resv.tenant.id,
                  full_name: resv.tenant.full_name,
                  phone: resv.tenant.phone || "",
                  email: resv.tenant.email || "",
                  user_id: resv.tenant.user_id || 0,
                }
                : undefined,
              reservation: {
                id: resv.id,
                apartment_id: resv.apartment_id,
                tenant_id: resv.tenant_id,
                deposit_amount: resv.deposit_amount,
                reserved_at: resv.reserved_at,
                expires_at: resv.expires_at,
                status: resv.status,
                created_at: resv.created_at,
                apartment: resv.apartment
                  ? {
                    id: resv.apartment.id,
                    building_id: resv.apartment.building_id,
                    floor: resv.apartment.floor,
                    room_number: resv.apartment.room_number,
                    area: 0,
                    rental_price: resv.deposit_amount,
                    building: undefined,
                  }
                  : undefined,
              },
              contract: null,
              items: [
                {
                  id: resv.id,
                  invoice_id: resv.id,
                  item_name: "Tiền cọc phòng",
                  quantity: 1,
                  unit_price: resv.deposit_amount,
                  amount: resv.deposit_amount,
                },
              ],
              payments: [],
            } as unknown as Invoice;
          });

        const allCombinedMap = new Map<string, Invoice>();
        for (const inv of baseInvoices) {
          allCombinedMap.set(inv.invoice_code || String(inv.id), inv);
        }
        for (const inv of depositInvoicesFromPayments) {
          allCombinedMap.set(inv.invoice_code || String(inv.id), inv);
        }
        for (const inv of syntheticDepositInvoices) {
          allCombinedMap.set(inv.invoice_code || String(inv.id), inv);
        }

        let combinedInvoices = Array.from(allCombinedMap.values());

        if (statusFilter) {
          combinedInvoices = combinedInvoices.filter((inv) => inv.status === statusFilter);
        }
        if (buildingFilter) {
          combinedInvoices = combinedInvoices.filter((inv) => {
            const apt = inv.contract?.apartment || inv.reservation?.apartment;
            return apt ? Number(apt.building_id) === Number(buildingFilter) : true;
          });
        }
        if (monthFilter || yearFilter) {
          combinedInvoices = combinedInvoices.filter((inv) => {
            const d = new Date(inv.created_at || inv.due_date);
            const m = d.getMonth() + 1;
            const y = d.getFullYear();
            if (monthFilter && m !== monthFilter) return false;
            if (yearFilter && y !== yearFilter) return false;
            return true;
          });
        }
        if (debouncedSearch) {
          const s = debouncedSearch.toLowerCase();
          combinedInvoices = combinedInvoices.filter((inv) => {
            const code = inv.invoice_code?.toLowerCase() || "";
            const tenantName = (inv.contract?.tenant?.full_name || inv.tenant?.full_name || inv.reservation?.tenant?.full_name || "").toLowerCase();
            const room = (inv.contract?.apartment?.room_number || inv.reservation?.apartment?.room_number || "").toLowerCase();
            return code.includes(s) || tenantName.includes(s) || room.includes(s);
          });
        }

        return { data: combinedInvoices };
      } catch {
        return { data: baseInvoices };
      }
    },
    select: (res) => res.data,
  });
  const invoices = invoicesRes || [];

  // Sắp xếp
  const { items: sortedInvoices, requestSort, getSortIcon, sortConfig } = useSort<Invoice>(invoices, {
    key: "created_at",
    direction: "desc",
  });

  // Pagination
  const { currentPage, setCurrentPage, totalPages, startIdx, endIdx } = usePagination({
    totalItems: sortedInvoices.length,
    initialPageSize: 10,
  });

  const paginatedInvoices = useMemo(() => {
    return sortedInvoices.slice(startIdx, endIdx);
  }, [sortedInvoices, startIdx, endIdx]);

  // Tạo hóa đơn
  const handleGenerateInvoice = useMutation({
    mutationFn: (payload: invoiceService.GenerateMonthlyInvoicesPayload) =>
      invoiceService.generateMonthlyInvoices(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success(res.message || "Tạo hóa đơn thành công!");
      generateModal.onClose();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Tạo hóa đơn thất bại");
    },
  });

  const handleUpdateStatusInvoice = useMutation({
    mutationFn: async ({ id, status, invoice }: { id: number; status: string; invoice?: Invoice }) => {
      try {
        return await invoiceService.updateInvoiceStatus(id, status);
      } catch (err) {
        if (role === "MANAGER" && invoice && (invoice.type === "DEPOSIT" || invoice.invoice_code?.startsWith("DEP-"))) {
          if (invoice.payments && invoice.payments.length > 0) {
            const paymentId = invoice.payments[0].id;
            const paymentStatus = status === "PAID" ? "SUCCESS" : "FAILED";
            return await paymentService.updateStatus(paymentId, paymentStatus);
          } else if (status === "PAID") {
            return await paymentService.create({
              invoice_id: invoice.id > 0 ? invoice.id : Number(invoice.reservation_id),
              amount: Number(invoice.total_amount),
              payment_method: "BANK_TRANSFER",
              status: "SUCCESS",
            });
          }
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      toast.success("Cập nhật trạng thái hóa đơn thành công!");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Cập nhật thất bại");
    },
  });

  const handleOpenDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    detailsModal.onOpen();
  };

  const handleToggleStatus = (invoice: Invoice) => {
    const nextStatus = invoice.status === "PAID" ? "UNPAID" : "PAID";
    handleUpdateStatusInvoice.mutate({ id: invoice.id, status: nextStatus, invoice });
  };

  return {
    role,
    managedBuildingId,
    invoices: paginatedInvoices,
    rawInvoicesCount: invoices.length,
    buildings,
    isLoading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
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

    // Details Modal
    selectedInvoice,
    detailsModal,
    handleOpenDetails,

    // Generate Modal
    generateModal,
    generateInvoices: handleGenerateInvoice.mutate,
    isGenerating: handleGenerateInvoice.isPending,

    // Status Toggle
    handleToggleStatus,
    isUpdatingStatus: handleUpdateStatusInvoice.isPending,

    refetch,
  };
}
