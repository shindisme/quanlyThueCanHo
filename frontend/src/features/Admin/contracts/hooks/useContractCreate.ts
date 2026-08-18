import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as contractService from "../../../../services/contractService";
import * as apartmentService from "../../../../services/apartmentService";
import * as reservationService from "../../../../services/reservationService";
import { contractSchema, type ContractFormValues } from "../../../../schemas/contract.schema";
import { queryKeys } from "../../../../constants/queryKeys";
import type { Apartment } from "../../../../types";
import type { Role } from "../../../../constants/enums";

interface UseContractCreateOptions {
  isOpen: boolean;
  onSuccess: () => void;
  role: Role | string | null;
  managerBuildingId?: number;
  initialTenantId?: number;
  initialBuildingId?: number;
  initialApartmentId?: number;
  initialFloor?: number;
  apartments: Apartment[];
}

const DEFAULT_CONTRACT_FORM = {
  is_new_tenant: false,
  tenant_id: null,
  building_id: undefined,
  floor: undefined,
  apartment_id: undefined,
  start_date: "",
  end_date: "",
  actual_occupants: undefined,
  monthly_rent: 0,
};

export function useContractCreate({
  isOpen,
  onSuccess,
  role,
  managerBuildingId,
  initialTenantId,
  initialBuildingId,
  initialApartmentId,
  initialFloor,
  apartments,
}: UseContractCreateOptions) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: DEFAULT_CONTRACT_FORM,
  });

  const formValues = useWatch({ control });
  const tenantIdValue = formValues.tenant_id;
  const buildingIdValue = formValues.building_id;
  const floorValue = formValues.floor;
  const apartmentIdValue = formValues.apartment_id;
  const startDateValue = formValues.start_date;
  const endDateValue = formValues.end_date;
  const actualOccupantsValue = formValues.actual_occupants;
  const monthlyRentValue = formValues.monthly_rent;

  // Lấy danh sách phiếu đặt cọc đang hoạt động
  const { data: activeReservations = [], isLoading: loadingReservations } = useQuery({
    queryKey: queryKeys.reservations.list({ status: "ACTIVE" }),
    queryFn: () => reservationService.getReservations({ status: "ACTIVE" }),
    select: (res) => res.data || [],
    enabled: isOpen,
  });

  // Danh sách người thuê đang có cọc giữ chỗ
  const depositingTenants = useMemo(() => {
    const list: Array<{ id: number; full_name: string; citizen_id?: string | null; phone?: string | null }> = [];
    const seen = new Set<number>();
    for (const r of activeReservations) {
      if (r.tenant && !seen.has(r.tenant.id)) {
        seen.add(r.tenant.id);
        list.push({
          id: r.tenant.id,
          full_name: r.tenant.full_name,
          citizen_id: r.tenant.citizen_id,
          phone: r.tenant.phone,
        });
      }
    }
    return list;
  }, [activeReservations]);

  // Lấy danh sách căn hộ theo chi nhánh được chọn
  const { data: buildingApartments = [], isLoading: loadingApartments } = useQuery({
    queryKey: queryKeys.apartments.list({ buildingId: buildingIdValue }),
    queryFn: () => apartmentService.getAllPage({ building_id: buildingIdValue }),
    select: (res) => res.data,
    enabled: !!buildingIdValue,
  });

  // Tìm căn hộ được chọn
  const selectedApartment = useMemo(() => {
    if (!apartmentIdValue) return null;
    return (
      buildingApartments.find((a: Apartment) => a.id === apartmentIdValue) ||
      apartments.find((a: Apartment) => a.id === apartmentIdValue) ||
      null
    );
  }, [apartmentIdValue, buildingApartments, apartments]);

  // Tìm phiếu đặt cọc của căn hộ được chọn
  const activeReservationForApartment = useMemo(() => {
    if (!apartmentIdValue) return null;
    return (
      activeReservations.find(
        (r) => r.apartment_id === apartmentIdValue && r.status === "ACTIVE"
      ) || null
    );
  }, [activeReservations, apartmentIdValue]);


  const reservedApartmentIds = useMemo(() => {
    return new Set(activeReservations.map((r) => r.apartment_id));
  }, [activeReservations]);

  // Danh sách tầng thuộc tòa nhà đã cọc
  const formFloors = useMemo(() => {
    const apts = buildingIdValue ? buildingApartments : apartments;
    const reservedApts = apts.filter((a: Apartment) =>
      reservedApartmentIds.has(a.id) || a.status === "RESERVED" || a.id === initialApartmentId
    );
    const targetApts = reservedApts.length > 0 ? reservedApts : [];
    return Array.from(new Set(targetApts.map((a: Apartment) => a.floor))).sort(
      (a: number, b: number) => a - b
    );
  }, [buildingApartments, apartments, buildingIdValue, reservedApartmentIds, initialApartmentId]);

  // Danh sách căn hộ đã đặt cọc theo tầng
  const formApartments = useMemo(() => {
    const apts = buildingIdValue ? buildingApartments : apartments;
    let reservedApts = apts.filter((a: Apartment) =>
      reservedApartmentIds.has(a.id) || a.status === "RESERVED" || a.id === initialApartmentId
    );
    if (tenantIdValue) {
      const tenantRes = activeReservations.filter((r) => r.tenant_id === tenantIdValue);
      const tenantAptIds = new Set(tenantRes.map((r) => r.apartment_id));
      if (tenantAptIds.size > 0) {
        reservedApts = reservedApts.filter((a) => tenantAptIds.has(a.id));
      }
    }
    if (floorValue === undefined || floorValue === null) {
      return reservedApts;
    }
    return reservedApts.filter(
      (a: Apartment) => Number(a.floor) === Number(floorValue)
    );
  }, [buildingApartments, apartments, buildingIdValue, floorValue, reservedApartmentIds, initialApartmentId, tenantIdValue, activeReservations]);

  // Số người ở tối đa tính theo căn hộ được chọn
  const maxOccupants = useMemo(() => {
    if (!selectedApartment) return 0;
    return selectedApartment.bedrooms * 2 || 2;
  }, [selectedApartment]);

  // Reset form khi mở modal
  useEffect(() => {
    if (isOpen) {
      let resolvedBuildingId = role === "MANAGER" ? managerBuildingId : initialBuildingId;
      let resolvedFloor = initialFloor;
      let resolvedApartmentId = initialApartmentId;
      let resolvedRent = 0;

      if (initialTenantId) {
        const matchRes = activeReservations.find((r) => r.tenant_id === initialTenantId);
        if (matchRes) {
          resolvedApartmentId = matchRes.apartment_id;
          if (matchRes.apartment) {
            resolvedBuildingId = matchRes.apartment.building_id;
            resolvedFloor = matchRes.apartment.floor;
          }
          const apt = buildingApartments.find((a: Apartment) => a.id === matchRes.apartment_id) || apartments.find((a: Apartment) => a.id === matchRes.apartment_id);
          if (apt?.rental_price) {
            resolvedRent = Number(apt.rental_price);
          } else if (matchRes.apartment?.rental_price) {
            resolvedRent = Number(matchRes.apartment.rental_price);
          }
        }
      } else if (initialApartmentId) {
        const apt = buildingApartments.find((a: Apartment) => a.id === initialApartmentId) || apartments.find((a: Apartment) => a.id === initialApartmentId);
        if (apt?.rental_price) {
          resolvedRent = Number(apt.rental_price);
        }
      }

      reset({
        ...DEFAULT_CONTRACT_FORM,
        tenant_id: initialTenantId || null,
        building_id: resolvedBuildingId,
        floor: resolvedFloor,
        apartment_id: resolvedApartmentId,
        monthly_rent: resolvedRent,
      });
    }
  }, [isOpen, initialTenantId, initialBuildingId, initialApartmentId, initialFloor, role, managerBuildingId, activeReservations, buildingApartments, apartments, reset]);

  // Xử lý khi chọn người thuê
  const handleSelectTenant = (val: string) => {
    const tId = val ? Number(val) : null;
    setValue("tenant_id", tId);
    if (!tId) return;

    const matchingReservation = activeReservations.find((r) => r.tenant_id === tId);
    if (matchingReservation) {
      if (matchingReservation.apartment) {
        setValue("building_id", matchingReservation.apartment.building_id);
        setValue("floor", matchingReservation.apartment.floor);
      }
      setValue("apartment_id", matchingReservation.apartment_id);
      const apt = buildingApartments.find((a: Apartment) => a.id === matchingReservation.apartment_id) || apartments.find((a: Apartment) => a.id === matchingReservation.apartment_id);
      if (apt?.rental_price) {
        setValue("monthly_rent", Number(apt.rental_price));
      } else if (matchingReservation.apartment?.rental_price) {
        setValue("monthly_rent", Number(matchingReservation.apartment.rental_price));
      }
    }
  };

  // Xử lý khi chọn căn hộ
  const handleSelectApartment = (val: string) => {
    const aptId = val ? Number(val) : undefined;
    setValue("apartment_id", aptId);
    if (!aptId) return;

    const matchingReservation = activeReservations.find((r) => r.apartment_id === aptId);
    if (matchingReservation?.tenant_id) {
      setValue("tenant_id", matchingReservation.tenant_id);
    }
    const apt = buildingApartments.find((a: Apartment) => a.id === aptId) || apartments.find((a: Apartment) => a.id === aptId);
    if (apt?.rental_price) {
      setValue("monthly_rent", Number(apt.rental_price));
    }
  };

  useEffect(() => {
    if (activeReservationForApartment?.tenant_id && !tenantIdValue) {
      setValue("tenant_id", activeReservationForApartment.tenant_id);
    }
  }, [activeReservationForApartment, tenantIdValue, setValue]);

  useEffect(() => {
    if (selectedApartment?.rental_price && !monthlyRentValue) {
      setValue("monthly_rent", Number(selectedApartment.rental_price));
    }
  }, [selectedApartment, monthlyRentValue, setValue]);

  const isTenantLocked = Boolean(
    initialTenantId || (activeReservationForApartment?.tenant_id && initialApartmentId)
  );
  const isBuildingLocked = Boolean(
    role === "MANAGER" || initialBuildingId
  );
  const isFloorLocked = Boolean(initialFloor !== undefined);
  const isApartmentLocked = Boolean(initialApartmentId);
  const hasReservationContext = Boolean(
    initialTenantId || activeReservationForApartment || initialApartmentId
  );

  const createMutation = useMutation({
    mutationFn: (data: ContractFormValues) =>
      contractService.create({
        apartment_id: data.apartment_id!,
        tenant_id: data.tenant_id!,
        start_date: data.start_date!,
        end_date: data.end_date!,
        monthly_rent: data.monthly_rent!,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contracts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.apartments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      toast.success("Tạo hợp đồng thành công!");
      onSuccess();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string; error?: string } } };
      toast.error(
        err.response?.data?.message || err.response?.data?.error || "Tạo hợp đồng thất bại!"
      );
    },
  });

  const handleFormSubmit = handleSubmit(
    (data) => {
      createMutation.mutate(data);
    },
    (formErrors) => {
      const firstError = Object.values(formErrors)[0];
      if (firstError?.message) {
        toast.error(String(firstError.message));
      } else {
        toast.error("Vui lòng kiểm tra và điền đầy đủ các thông tin bắt buộc!");
      }
    }
  );

  return {
    register,
    handleFormSubmit,
    handleSelectTenant,
    handleSelectApartment,
    setValue,
    errors,
    saving: createMutation.isPending,
    loadingApartments,
    loadingReservations,
    depositingTenants,
    tenantIdValue,
    buildingIdValue,
    floorValue,
    apartmentIdValue,
    startDateValue,
    endDateValue,
    formFloors,
    formApartments,
    actualOccupantsValue,
    monthlyRentValue,
    maxOccupants,
    buildingApartments,
    isTenantLocked,
    isBuildingLocked,
    isFloorLocked,
    isApartmentLocked,
    hasReservationContext,
    activeReservationForApartment,
  };
}
