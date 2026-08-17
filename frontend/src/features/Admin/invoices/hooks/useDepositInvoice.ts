import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as apartmentService from "../../../../services/apartmentService";
import * as reservationService from "../../../../services/reservationService";
import * as tenantService from "../../../../services/tenantService";
import type { Apartment } from "../../../../types";
import { depositFormSchema } from "../../../../schemas/invoice.schema";
import { queryKeys } from "../../../../constants/queryKeys";

export type DepositTenantMode = "existing" | "new";

export type DepositForm = {
  tenant_mode: DepositTenantMode;
  tenant_id: string;
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
  payment_method: "VNPAY" | "CASH";
};

export const emptyDepositForm = (): DepositForm => ({
  tenant_mode: "new",
  tenant_id: "",
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
  payment_method: "VNPAY",
});

export const getPresetForm = (apt: Apartment): DepositForm => ({
  ...emptyDepositForm(),
  building_id: String(apt.building_id),
  floor: String(apt.floor),
  apartment_id: String(apt.id),
  deposit_amount: apt.rental_price || 0,
});

export const createDepositForm = (presetApartment?: Apartment | null): DepositForm => {
  if (presetApartment) return getPresetForm(presetApartment);
  return emptyDepositForm();
};

const depositCommonSchema = depositFormSchema.pick({
  apartment_id: true,
  move_in_date: true,
  deposit_amount: true,
});

export const validateDepositForm = (form: DepositForm, fixedApartment?: Apartment): string | null => {
  const targetAptId = fixedApartment ? String(fixedApartment.id) : form.apartment_id;
  const commonPayload = {
    apartment_id: targetAptId,
    move_in_date: form.move_in_date,
    deposit_amount: Number(form.deposit_amount),
  };

  if (form.tenant_mode === "existing") {
    const commonResult = depositCommonSchema.safeParse(commonPayload);
    if (!commonResult.success) {
      return commonResult.error.issues[0]?.message || "Thông tin không hợp lệ";
    }

    if (!form.tenant_id) {
      return "Vui lòng chọn khách thuê đã tồn tại";
    }

    return null;
  }

  const result = depositFormSchema.safeParse({
    ...form,
    ...commonPayload,
  });

  if (!result.success) {
    return result.error.issues[0]?.message || "Thông tin không hợp lệ";
  }
  return null;
};

export const availableApartmentKeys = {
  all: ["available-apartments-for-deposit"] as const,
  list: (role?: string | null, managedBuildingId?: number) =>
    [...availableApartmentKeys.all, role, managedBuildingId] as const,
};

const depositTenantKeys = {
  all: ["deposit-tenants"] as const,
  list: (role?: string | null, managedBuildingId?: number) =>
    [...depositTenantKeys.all, role, managedBuildingId] as const,
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

  const {
    data: tenants = [],
    isLoading: isLoadingTenants,
    refetch: refetchTenants,
  } = useQuery({
    queryKey: depositTenantKeys.list(role, managedBuildingId),
    queryFn: () => tenantService.getAllPage(),
    select: (res) => res.data,
    enabled: isOpen,
  });

  const selectedApartment = useMemo(() => {
    if (fixedApartment) return fixedApartment;
    return availableApartments.find((apt) => String(apt.id) === form.apartment_id) || null;
  }, [fixedApartment, availableApartments, form.apartment_id]);

  const selectedTenant = useMemo(() => {
    return tenants.find((tenant) => String(tenant.id) === form.tenant_id) || null;
  }, [tenants, form.tenant_id]);

  const tenantOptions = useMemo(() => {
    return tenants
      .map((tenant) => ({
        value: String(tenant.id),
        label: `${tenant.full_name} (${tenant.citizen_id})`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "vi"));
  }, [tenants]);

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
    mutationFn: () => {
      const basePayload = {
        apartment_id: fixedApartment ? fixedApartment.id : Number(form.apartment_id),
        deposit_amount: Number(form.deposit_amount),
        payment_method: form.payment_method,
        move_in_date: form.move_in_date,
      };

      if (form.tenant_mode === "existing") {
        return reservationService.createReservationDeposit({
          ...basePayload,
          tenant_id: Number(form.tenant_id),
        });
      }

      return reservationService.createReservationDeposit({
        ...basePayload,
        tenant: {
          full_name: form.full_name.trim(),
          phone: form.phone.trim() || null,
          email: form.email.trim(),
          citizen_id: form.citizen_id.trim(),
          date_of_birth: form.date_of_birth || null,
          address: form.address.trim() || null,
        },
      });
    },
    onSuccess: async () => {
      toast.success(form.payment_method === "CASH"
        ? "Đã lập hóa đơn và ghi nhận tiền cọc tiền mặt"
        : "Đã lập hóa đơn và gửi email thanh toán VNPay");
      setIsOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all }),
        queryClient.invalidateQueries({ queryKey: availableApartmentKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["reservations"] }),
      ]);
      if (onSuccessCallback) onSuccessCallback();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string; error?: string } } };
      toast.error(err.response?.data?.message || err.response?.data?.error || "Không thể lập hóa đơn cọc");
    },
  });

  const openModal = useCallback((presetApartment?: Apartment) => {
    const targetApt = presetApartment || fixedApartment;
    const initialForm = createDepositForm(targetApt);
    if (!targetApt && role === "MANAGER" && managedBuildingId) {
      initialForm.building_id = String(managedBuildingId);
    }
    setForm(initialForm);
    if (!targetApt) {
      void refetchAvailableApartments();
    }
    void refetchTenants();
    setIsOpen(true);
  }, [fixedApartment, role, managedBuildingId, refetchAvailableApartments, refetchTenants]);

  const closeModal = useCallback(() => {
    if (depositMutation.isPending) return;
    setIsOpen(false);
  }, [depositMutation.isPending]);

  const handleTenantModeChange = useCallback((tenantMode: DepositTenantMode) => {
    setForm((prev) => ({
      ...prev,
      tenant_mode: tenantMode,
      tenant_id: tenantMode === "existing" ? prev.tenant_id : "",
    }));
  }, []);

  const handleTenantChange = useCallback((value: string) => {
    setForm((prev) => ({
      ...prev,
      tenant_id: value,
    }));
  }, []);

  const handleBuildingChange = useCallback((value: string) => {
    setForm((prev) => ({
      ...prev,
      building_id: value,
      floor: "",
      apartment_id: "",
      deposit_amount: 0,
    }));
  }, []);

  const handleFloorChange = useCallback((value: string) => {
    setForm((prev) => ({
      ...prev,
      floor: value,
      apartment_id: "",
      deposit_amount: 0,
    }));
  }, []);

  const handleApartmentChange = useCallback((value: string) => {
    const selected = availableApartments.find((apt) => String(apt.id) === value);
    setForm((prev) => ({
      ...prev,
      apartment_id: value,
      deposit_amount: selected?.rental_price || 0,
    }));
  }, [availableApartments]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const error = validateDepositForm(form, fixedApartment);
    if (error) {
      toast.error(error);
      return;
    }
    depositMutation.mutate();
  }, [form, fixedApartment, depositMutation]);

  return {
    isOpen,
    openModal,
    closeModal,
    form,
    setForm,
    availableApartments,
    isLoadingAvailableApartments,
    tenants,
    isLoadingTenants,
    tenantOptions,
    selectedTenant,
    buildingOptions,
    floorOptions,
    apartmentOptions,
    selectedApartment,
    handleTenantModeChange,
    handleTenantChange,
    handleBuildingChange,
    handleFloorChange,
    handleApartmentChange,
    handleSubmit,
    isPending: depositMutation.isPending,
    role,
    isManager: role === "MANAGER",
  };
}

export type DepositInvoiceController = ReturnType<typeof useDepositInvoice>;