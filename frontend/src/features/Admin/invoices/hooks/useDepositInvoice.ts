import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as apartmentService from "../../../../services/apartmentService";
import * as reservationService from "../../../../services/reservationService";
import type { Apartment } from "../../../../types";
import { depositFormSchema } from "../../../../schemas/invoice.schema";

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

export const getPresetForm = (apt: Apartment): DepositForm => ({
  ...emptyDepositForm(),
  building_id: String(apt.building_id),
  floor: String(apt.floor),
  apartment_id: String(apt.id),
  deposit_amount: apt.rental_price || 0,
});

export const availableApartmentKeys = {
  all: ["available-apartments-for-deposit"] as const,
  list: (role?: string | null, managedBuildingId?: number) =>
    [...availableApartmentKeys.all, role, managedBuildingId] as const,
};

export interface UseDepositInvoiceOptions {
  fixedApartment?: Apartment;
  role?: string | null;
  managedBuildingId?: number;
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
    queryKey: availableApartmentKeys.list(role, managedBuildingId),
    queryFn: () =>
      apartmentService.getAllPage({
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
      void queryClient.invalidateQueries({ queryKey: availableApartmentKeys.all });
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
      setForm(getPresetForm(targetApt));
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

  const validateForm = (): boolean => {
    const targetAptId = fixedApartment ? String(fixedApartment.id) : form.apartment_id;
    const result = depositFormSchema.safeParse({
      ...form,
      apartment_id: targetAptId,
      deposit_amount: Number(form.deposit_amount),
    });

    if (!result.success) {
      const firstError = result.error.issues[0];
      toast.error(firstError.message);
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
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

export type DepositInvoiceController = ReturnType<typeof useDepositInvoice>;
