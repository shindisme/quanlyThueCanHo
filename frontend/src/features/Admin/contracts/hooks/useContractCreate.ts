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
  const { data: activeReservations = [] } = useQuery({
    queryKey: queryKeys.reservations.list({ status: "ACTIVE" }),
    queryFn: () => reservationService.getReservations({ status: "ACTIVE" }),
    select: (res) => res.data || [],
    enabled: isOpen,
  });

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

  // Danh sách tầng thuộc tòa nhà
  const formFloors = useMemo(() => {
    const apts = buildingIdValue ? buildingApartments : apartments;
    const reservedApts = apts.filter((a: Apartment) => a.status === "RESERVED");
    const targetApts = reservedApts.length > 0 ? reservedApts : apts;
    return Array.from(new Set(targetApts.map((a: Apartment) => a.floor))).sort(
      (a: number, b: number) => a - b
    );
  }, [buildingApartments, apartments, buildingIdValue]);

  // Danh sách căn hộ đã đặt cọc theo tầng
  const formApartments = useMemo(() => {
    const apts = buildingIdValue ? buildingApartments : apartments;
    if (!floorValue && floorValue !== 0) return apts.filter((a: Apartment) => a.status === "RESERVED");
    return apts.filter(
      (a: Apartment) => Number(a.floor) === Number(floorValue) && a.status === "RESERVED"
    );
  }, [buildingApartments, apartments, buildingIdValue, floorValue]);

  // Số người ở tối đa tính theo căn hộ được chọn
  const maxOccupants = useMemo(() => {
    if (!selectedApartment) return 0;
    return selectedApartment.bedrooms * 2 || 2;
  }, [selectedApartment]);

  // Reset form khi mở modal
  useEffect(() => {
    if (isOpen) {
      reset({
        ...DEFAULT_CONTRACT_FORM,
        tenant_id: initialTenantId || null,
        building_id: role === "MANAGER" ? managerBuildingId : initialBuildingId,
        floor: initialFloor,
        apartment_id: initialApartmentId,
      });
    }
  }, [isOpen, initialTenantId, initialBuildingId, initialApartmentId, initialFloor, role, managerBuildingId, reset]);

  useEffect(() => {
    if (activeReservationForApartment?.tenant_id && !initialTenantId) {
      setValue("tenant_id", activeReservationForApartment.tenant_id);
    }
  }, [activeReservationForApartment, initialTenantId, setValue]);

  useEffect(() => {
    if (selectedApartment?.rental_price) {
      setValue("monthly_rent", selectedApartment.rental_price);
    }
  }, [selectedApartment, setValue]);

  const isTenantLocked = Boolean(
    initialTenantId || activeReservationForApartment?.tenant_id
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
    setValue,
    errors,
    saving: createMutation.isPending,
    loadingApartments,
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
