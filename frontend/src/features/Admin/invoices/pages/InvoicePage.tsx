import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileText, Plus, ClipboardList, Receipt } from "lucide-react";
import PageHeader from "../../../../components/PageHeader";
import SearchInput from "../../../../components/ui/SearchInput";
import Combobox from "../../../../components/ui/Combobox";
import Button from "../../../../components/ui/Button";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import DefaultPagination from "../../../../components/ui/Pagination";
import Modal from "../../../../components/ui/Modal";
import Input from "../../../../components/ui/Input";
import { useInvoiceList } from "../hooks/useInvoiceList";
import InvoiceTable from "../components/InvoiceList";
import InvoiceDetailModal from "../components/InvoiceDetailModal";
import InvoiceGenerateModal from "../components/InvoiceGenerateModal";
import { printInvoiceHelper } from "../../../../utils/print";
import * as apartmentService from "../../../../services/apartmentService";
import * as reservationService from "../../../../services/reservationService";
import type { Apartment } from "../../../../types";

type DepositForm = {
  building_id: string;
  floor: string;
  apartment_id: string;
  full_name: string;
  phone: string;
  email: string;
  citizen_id: string;
  date_of_birth: string;
  address: string;
  move_in_date: string;
  deposit_amount: number;
};

const emptyDepositForm = (): DepositForm => ({
  building_id: "",
  floor: "",
  apartment_id: "",
  full_name: "",
  phone: "",
  email: "",
  citizen_id: "",
  date_of_birth: "",
  address: "",
  move_in_date: "",
  deposit_amount: 0,
});

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
}

function formatApartmentOption(apartment: Apartment) {
  const buildingName = apartment.building?.branch_name || apartment.building?.name || "Chi nhánh";
  return `${buildingName} - P.${apartment.room_number} - Tầng ${apartment.floor}`;
}

export default function InvoicePage() {
  const {
    role,
    managedBuildingId,
    invoices,
    rawInvoicesCount,
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
    currentPage,
    setCurrentPage,
    totalPages,
    selectedInvoice,
    detailsModal,
    handleOpenDetails,
    generateModal,
    generateInvoices,
    isGenerating,
    handleToggleStatus,
    refetch,
  } = useInvoiceList();

  const canManageDeposits = role === "ADMIN" || role === "MANAGER";
  const today = new Date().toISOString().split("T")[0];
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositForm, setDepositForm] = useState<DepositForm>(emptyDepositForm);

  const {
    data: availableApartments = [],
    isLoading: isLoadingAvailableApartments,
    refetch: refetchAvailableApartments,
  } = useQuery({
    queryKey: ["available-apartments-for-deposit", role, managedBuildingId],
    queryFn: () =>
      apartmentService.getAllApartmentsPage({
        status: "AVAILABLE",
        building_id: role === "MANAGER" ? managedBuildingId || undefined : undefined,
      }),
    select: (res) => res.data,
    enabled: role === "ADMIN" || (role === "MANAGER" && !!managedBuildingId),
  });

  const selectedDepositApartment = useMemo(
    () => availableApartments.find((apartment) => String(apartment.id) === depositForm.apartment_id) || null,
    [availableApartments, depositForm.apartment_id]
  );

  const depositMutation = useMutation({
    mutationFn: () =>
      reservationService.createReservationDeposit({
        apartment_id: Number(depositForm.apartment_id),
        deposit_amount: Number(depositForm.deposit_amount),
        move_in_date: depositForm.move_in_date,
        tenant: {
          full_name: depositForm.full_name.trim(),
          phone: depositForm.phone.trim() || null,
          email: depositForm.email.trim(),
          citizen_id: depositForm.citizen_id.trim(),
          date_of_birth: depositForm.date_of_birth || null,
          address: depositForm.address.trim() || null,
        },
      }),
    onSuccess: () => {
      toast.success("Đã lập hóa đơn cọc phòng");
      setShowDepositModal(false);
      refetch();
      void refetchAvailableApartments();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string; error?: string } } };
      toast.error(err.response?.data?.message || err.response?.data?.error || "Không thể lập hóa đơn cọc");
    },
  });

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = currentYear - 2 + i;
    return { value: String(y), label: `Năm ${y}` };
  });

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: `Tháng ${i + 1}`,
  }));

  const depositBuildingOptions = Array.from(
    new Map(
      availableApartments.map((apartment) => [
        String(apartment.building_id),
        {
          value: String(apartment.building_id),
          label: apartment.building?.branch_name || apartment.building?.name || "Chi nhánh",
        },
      ])
    ).values()
  ).sort((a, b) => a.label.localeCompare(b.label, "vi"));

  const depositFloorOptions = Array.from(
    new Set(
      availableApartments
        .filter((apartment) => !depositForm.building_id || String(apartment.building_id) === depositForm.building_id)
        .map((apartment) => apartment.floor)
    )
  )
    .sort((a, b) => a - b)
    .map((floor) => ({ value: String(floor), label: `Tầng ${floor}` }));

  const depositApartmentOptions = availableApartments
    .filter((apartment) => String(apartment.building_id) === depositForm.building_id)
    .filter((apartment) => String(apartment.floor) === depositForm.floor)
    .map((apartment) => ({
      value: String(apartment.id),
      label: `P.${apartment.room_number}`,
    }));

  const handleMonthChange = (val: string) => {
    if (!val) {
      setMonthFilter(undefined);
      setYearFilter(undefined);
    } else {
      setMonthFilter(Number(val));
      if (!yearFilter) {
        setYearFilter(currentYear);
      }
    }
  };

  const handleYearChange = (val: string) => {
    if (!val) {
      setYearFilter(undefined);
      setMonthFilter(undefined);
    } else {
      setYearFilter(Number(val));
      if (!monthFilter) {
        setMonthFilter(new Date().getMonth() + 1);
      }
    }
  };

  const handleOpenDepositModal = () => {
    setDepositForm(emptyDepositForm());
    setShowDepositModal(true);
    void refetchAvailableApartments();
  };

  const handleDepositBuildingChange = (value: string) => {
    setDepositForm((prev) => ({
      ...prev,
      building_id: value,
      floor: "",
      apartment_id: "",
      deposit_amount: 0,
    }));
  };

  const handleDepositFloorChange = (value: string) => {
    setDepositForm((prev) => ({
      ...prev,
      floor: value,
      apartment_id: "",
      deposit_amount: 0,
    }));
  };
  const handleDepositApartmentChange = (value: string) => {
    const selected = availableApartments.find((apartment) => String(apartment.id) === value);
    setDepositForm((prev) => ({
      ...prev,
      apartment_id: value,
      deposit_amount: selected?.rental_price || 0,
    }));
  };

  const handleDepositSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!depositForm.apartment_id) {
      toast.error("Vui lòng chọn căn hộ đặt cọc");
      return;
    }
    if (!depositForm.full_name.trim() || !depositForm.citizen_id.trim() || !depositForm.email.trim()) {
      toast.error("Vui lòng nhập họ tên, CCCD và email người thuê");
      return;
    }
    if (!depositForm.move_in_date) {
      toast.error("Vui lòng chọn ngày dọn vào");
      return;
    }
    if (!Number.isFinite(Number(depositForm.deposit_amount)) || Number(depositForm.deposit_amount) <= 0) {
      toast.error("Số tiền cọc phải lớn hơn 0");
      return;
    }
    depositMutation.mutate();
  };

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        icon={FileText}
        title="Quản lý hóa đơn"
        subtitle="Theo dõi công nợ, tính tiền dịch vụ hằng tháng và kiểm soát trạng thái thanh toán"
        count={rawInvoicesCount}
        iconColor="linear-gradient(135deg, #10B981, #3B82F6)"
        actions={
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Tìm theo mã HD, số phòng, tên khách thuê..."
              className="w-64 sm:w-80 flex-1 min-w-0"
            />
            {canManageDeposits && (
              <Button type="button" variant="outline" onClick={handleOpenDepositModal} className="flex items-center gap-2 rounded-xl shrink-0 shadow-md font-semibold">
                <Receipt size={16} />
                <span>Lập hóa đơn đặt cọc</span>
              </Button>
            )}
            {canManageDeposits && (
              <Button onClick={generateModal.onOpen} className="flex items-center gap-2 rounded-xl shrink-0 shadow-md font-semibold">
                <Plus size={16} />
                <span>Tính tiền tháng này</span>
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-12 gap-3 w-full">
        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <Combobox
            options={[
              { value: "PAID", label: "Đã thanh toán" },
              { value: "UNPAID", label: "Chưa thanh toán" },
              { value: "OVERDUE", label: "Quá hạn" },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Trạng thái"
            searchable={false}
            className="w-full"
            triggerClassName="h-[42px] rounded-none border-gray-300 px-3 rounded-xl"
            clearable={true}
          />
        </div>

        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <Combobox
            options={monthOptions}
            value={monthFilter ? String(monthFilter) : ""}
            onChange={handleMonthChange}
            placeholder="Tháng"
            searchable={false}
            className="w-full"
            triggerClassName="h-[42px] rounded-none border-gray-300 px-3 rounded-xl"
            clearable={true}
          />
        </div>

        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <Combobox
            options={yearOptions}
            value={yearFilter ? String(yearFilter) : ""}
            onChange={handleYearChange}
            placeholder="Năm"
            searchable={false}
            className="w-full"
            triggerClassName="h-[42px] rounded-none border-gray-300 px-3 rounded-xl"
            clearable={true}
          />
        </div>

        {role === "ADMIN" && (
          <div className="col-span-12 sm:col-span-6 md:col-span-3">
            <Combobox
              options={buildings.map((b) => ({ value: String(b.id), label: b.branch_name }))}
              value={buildingFilter ? String(buildingFilter) : ""}
              onChange={(val) => setBuildingFilter(val ? Number(val) : undefined)}
              placeholder="Tất cả chi nhánh"
              className="w-full"
              triggerClassName="h-[42px] rounded-none border-gray-300 px-3 rounded-xl"
              clearable={true}
            />
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <LoadingSpinner size={36} />
          <span className="text-sm text-gray-400 mt-2">Đang tải hóa đơn...</span>
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white border border-gray-200 shadow-md rounded-none">
          <ClipboardList size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Không tìm thấy hóa đơn nào phù hợp bộ lọc</p>
        </div>
      ) : (
        <div className="space-y-4">
          <InvoiceTable
            invoices={invoices}
            role={role}
            onOpenDetails={handleOpenDetails}
            onToggleStatus={handleToggleStatus}
            onPrint={printInvoiceHelper}
          />

          <div className="pt-2">
            <DefaultPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        </div>
      )}

      <InvoiceDetailModal isOpen={detailsModal.isOpen} onClose={detailsModal.onClose} invoice={selectedInvoice} />

      <InvoiceGenerateModal
        isOpen={generateModal.isOpen}
        onClose={generateModal.onClose}
        buildings={buildings}
        isGenerating={isGenerating}
        onGenerate={generateInvoices}
        role={role}
        managedBuildingId={managedBuildingId}
      />

      <Modal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        title="Lập hóa đơn đặt cọc"
        size="lg"
      >
        <form onSubmit={handleDepositSubmit} className="space-y-4 text-left">
          <div className="rounded-xl border border-primary-100 bg-primary-50/40 p-3 space-y-3">
            <p className="font-semibold text-gray-850">Căn hộ đặt cọc</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Combobox
                label="Chi nhánh"
                options={depositBuildingOptions}
                value={depositForm.building_id}
                onChange={handleDepositBuildingChange}
                placeholder={isLoadingAvailableApartments ? "Đang tải..." : "Chọn chi nhánh"}
                disabled={isLoadingAvailableApartments || depositMutation.isPending}
              />
              <Combobox
                label="Tầng"
                options={depositFloorOptions}
                value={depositForm.floor}
                onChange={handleDepositFloorChange}
                placeholder="Chọn tầng"
                disabled={!depositForm.building_id || isLoadingAvailableApartments || depositMutation.isPending}
              />
              <Combobox
                label="Căn hộ"
                options={depositApartmentOptions}
                value={depositForm.apartment_id}
                onChange={handleDepositApartmentChange}
                placeholder="Chọn căn hộ"
                disabled={!depositForm.floor || isLoadingAvailableApartments || depositMutation.isPending}
              />
            </div>

            {selectedDepositApartment && (
              <div className="rounded-lg border border-primary-100 bg-white/80 p-3 text-sm text-gray-700 space-y-1">
                <p className="font-semibold text-gray-800">Thông tin căn hộ được đặt cọc</p>
                <p>{formatApartmentOption(selectedDepositApartment)}</p>
                <p>Giá thuê: {formatCurrency(selectedDepositApartment.rental_price)}/tháng</p>
                {selectedDepositApartment.building?.address && <p>Địa chỉ: {selectedDepositApartment.building.address}</p>}
              </div>
            )}
          </div>
          <Input
            label="Họ tên người thuê"
            value={depositForm.full_name}
            onChange={(e) => setDepositForm((prev) => ({ ...prev, full_name: e.target.value }))}
            required
            disabled={depositMutation.isPending}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Số điện thoại"
              value={depositForm.phone}
              onChange={(e) => setDepositForm((prev) => ({ ...prev, phone: e.target.value }))}
              disabled={depositMutation.isPending}
            />
            <Input
              label="Email"
              type="email"
              value={depositForm.email}
              onChange={(e) => setDepositForm((prev) => ({ ...prev, email: e.target.value }))}
              required
              disabled={depositMutation.isPending}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="CCCD"
              value={depositForm.citizen_id}
              onChange={(e) => setDepositForm((prev) => ({ ...prev, citizen_id: e.target.value }))}
              required
              disabled={depositMutation.isPending}
            />
            <Input
              label="Ngày sinh"
              type="date"
              value={depositForm.date_of_birth}
              onChange={(e) => setDepositForm((prev) => ({ ...prev, date_of_birth: e.target.value }))}
              disabled={depositMutation.isPending}
            />
          </div>

          <Input
            label="Địa chỉ"
            value={depositForm.address}
            onChange={(e) => setDepositForm((prev) => ({ ...prev, address: e.target.value }))}
            disabled={depositMutation.isPending}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Ngày dọn vào"
              type="date"
              min={today}
              value={depositForm.move_in_date}
              onChange={(e) => setDepositForm((prev) => ({ ...prev, move_in_date: e.target.value }))}
              required
              disabled={depositMutation.isPending}
            />
            <Input
              label="Số tiền cọc"
              type="number"
              value={depositForm.deposit_amount}
              onChange={(e) => setDepositForm((prev) => ({ ...prev, deposit_amount: Number(e.target.value) }))}
              required
              disabled={depositMutation.isPending}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => setShowDepositModal(false)} disabled={depositMutation.isPending}>
              Hủy bỏ
            </Button>
            <Button type="submit" isLoading={depositMutation.isPending}>
              Lập hóa đơn cọc
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}