import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as apartmentService from "../../../../services/apartmentService";
import * as reservationService from "../../../../services/reservationService";
import type { Apartment } from "../../../../types";

export type DepositForm = {
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

export const emptyDepositForm = (): DepositForm => ({
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

interface UseDepositInvoiceOptions {
  role?: string | null;
  managedBuildingId?: number | null;
  fixedApartment?: Apartment | null;
  onSuccessCallback?: () => void;
}

export function useDepositInvoice(options?: UseDepositInvoiceOptions) {
  const { role, managedBuildingId, fixedApartment, onSuccessCallback } = options || {};
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<DepositForm>(emptyDepositForm);

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
    enabled: !fixedApartment && (role === "ADMIN" || (role === "MANAGER" && !!managedBuildingId)),
  });

  const selectedApartment = useMemo(() => {
    if (fixedApartment) return fixedApartment;
    return availableApartments.find((apt) => String(apt.id) === form.apartment_id) || null;
  }, [fixedApartment, availableApartments, form.apartment_id]);

  const buildingOptions = useMemo(() => {
    return Array.from(
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
  }, [availableApartments]);

  const floorOptions = useMemo(() => {
    return Array.from(
      new Set(
        availableApartments
          .filter((apartment) => !form.building_id || String(apartment.building_id) === form.building_id)
          .map((apartment) => apartment.floor)
      )
    )
      .sort((a, b) => a - b)
      .map((floor) => ({ value: String(floor), label: `Tầng ${floor}` }));
  }, [availableApartments, form.building_id]);

  const apartmentOptions = useMemo(() => {
    return availableApartments
      .filter((apartment) => String(apartment.building_id) === form.building_id)
      .filter((apartment) => String(apartment.floor) === form.floor)
      .map((apartment) => ({
        value: String(apartment.id),
        label: `P.${apartment.room_number}`,
      }));
  }, [availableApartments, form.building_id, form.floor]);

  const depositMutation = useMutation({
    mutationFn: () =>
      reservationService.createReservationDeposit({
        apartment_id: fixedApartment ? fixedApartment.id : Number(form.apartment_id),
        deposit_amount: Number(form.deposit_amount),
        move_in_date: form.move_in_date,
        tenant: {
          full_name: form.full_name.trim(),
          phone: form.phone.trim() || null,
          email: form.email.trim(),
          citizen_id: form.citizen_id.trim(),
          date_of_birth: form.date_of_birth || null,
          address: form.address.trim() || null,
        },
      }),
    onSuccess: () => {
      toast.success("Đã lập hóa đơn cọc phòng");
      setIsOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["invoices"] });
      void queryClient.invalidateQueries({ queryKey: ["available-apartments-for-deposit"] });
      if (onSuccessCallback) onSuccessCallback();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string; error?: string } } };
      toast.error(err.response?.data?.message || err.response?.data?.error || "Không thể lập hóa đơn cọc");
    },
  });

  const openModal = (presetApartment?: Apartment) => {
    const targetApt = presetApartment || fixedApartment;
    if (targetApt) {
      setForm({
        ...emptyDepositForm(),
        building_id: String(targetApt.building_id),
        floor: String(targetApt.floor),
        apartment_id: String(targetApt.id),
        deposit_amount: targetApt.rental_price || 0,
      });
    } else {
      setForm(emptyDepositForm());
      void refetchAvailableApartments();
    }
    setIsOpen(true);
  };

  const closeModal = () => {
    if (depositMutation.isPending) return;
    setIsOpen(false);
  };

  const handleBuildingChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      building_id: value,
      floor: "",
      apartment_id: "",
      deposit_amount: 0,
    }));
  };

  const handleFloorChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      floor: value,
      apartment_id: "",
      deposit_amount: 0,
    }));
  };

  const handleApartmentChange = (value: string) => {
    const selected = availableApartments.find((apt) => String(apt.id) === value);
    setForm((prev) => ({
      ...prev,
      apartment_id: value,
      deposit_amount: selected?.rental_price || 0,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const aptId = fixedApartment ? fixedApartment.id : Number(form.apartment_id);
    if (!aptId) {
      toast.error("Căn hộ: Vui lòng chọn căn hộ đặt cọc");
      return;
    }
    if (!form.full_name.trim()) {
      toast.error("Họ tên: Vui lòng nhập họ tên người thuê");
      return;
    }
    if (!form.phone.trim()) {
      toast.error("Số điện thoại: Vui lòng nhập số điện thoại người thuê");
      return;
    }
    if (!form.email.trim()) {
      toast.error("Email: Vui lòng nhập địa chỉ email người thuê");
      return;
    }
    if (!form.citizen_id.trim()) {
      toast.error("CCCD: Vui lòng nhập số CCCD người thuê");
      return;
    }
    if (!form.move_in_date) {
      toast.error("Ngày dọn vào: Vui lòng chọn ngày dọn vào");
      return;
    }
    const moveInDateObj = new Date(form.move_in_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(moveInDateObj.getTime()) || moveInDateObj < today) {
      toast.error("Ngày dọn vào: Ngày dọn vào không được ở trong quá khứ");
      return;
    }
    if (!Number.isFinite(Number(form.deposit_amount)) || Number(form.deposit_amount) <= 0) {
      toast.error("Số tiền cọc: Số tiền cọc phải lớn hơn 0");
      return;
    }
    depositMutation.mutate();
  };

  return {
    isOpen,
    openModal,
    closeModal,
    form,
    setForm,
    availableApartments,
    isLoadingAvailableApartments,
    buildingOptions,
    floorOptions,
    apartmentOptions,
    selectedApartment,
    handleBuildingChange,
    handleFloorChange,
    handleApartmentChange,
    handleSubmit,
    isPending: depositMutation.isPending,
  };
}
