import { useState, useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as contractService from "../../../../services/contractService";
import * as apartmentService from "../../../../services/apartmentService";
import { contractSchema, type ContractFormValues } from "../../../../schemas/contract.schema";
import { QUERY_KEYS } from "../../../../constants/queryKeys";
import type { Apartment } from "../../../../types";

interface UseContractCreateOptions {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentUser: { id: number };
  role: string | null;
  managerBuildingId?: number;
  initialTenantId?: number;
  initialBuildingId?: number;
  initialApartmentId?: number;
  initialFloor?: number;
  apartments: Apartment[];
}

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
    defaultValues: {
      is_new_tenant: false,
      tenant_id: null,
      building_id: undefined as unknown as number,
      floor: undefined as unknown as number,
      apartment_id: undefined as unknown as number,
      start_date: "",
      end_date: "",
      actual_occupants: undefined as unknown as number,
      monthly_rent: 0,
    },
  });

  const tenantIdValue = useWatch({ control, name: "tenant_id" });
  const buildingIdValue = useWatch({ control, name: "building_id" });
  const floorValue = useWatch({ control, name: "floor" });
  const apartmentIdValue = useWatch({ control, name: "apartment_id" });
  const startDateValue = useWatch({ control, name: "start_date" });
  const endDateValue = useWatch({ control, name: "end_date" });
  const actualOccupantsValue = useWatch({ control, name: "actual_occupants" });
  const monthlyRentValue = useWatch({ control, name: "monthly_rent" });

  // Fetch apartments for the selected building
  const { data: buildingApartments = [], isLoading: loadingApartments } = useQuery({
    queryKey: ["apartments", "building", buildingIdValue],
    queryFn: () => apartmentService.getAllPage({ building_id: buildingIdValue }),
    select: (res) => res.data as unknown as Apartment[],
    enabled: !!buildingIdValue,
  });

  // Calculate floors for selected building
  const formFloors = useMemo(() => {
    const apts = buildingIdValue ? buildingApartments : apartments;
    const floors = Array.from(new Set(apts.map((a: Apartment) => a.floor))).sort(
      (a: number, b: number) => a - b
    );
    return floors;
  }, [buildingApartments, apartments, buildingIdValue]);

  // Available apartments for selected floor
  const formApartments = useMemo(() => {
    const apts = buildingIdValue ? buildingApartments : apartments;
    if (!floorValue && floorValue !== 0) return apts;
    return apts.filter(
      (a: Apartment) => Number(a.floor) === Number(floorValue) && (a.status === "AVAILABLE" || a.status === "RESERVED")
    );
  }, [buildingApartments, apartments, buildingIdValue, floorValue]);

  // Max occupants for the selected apartment
  const maxOccupants = useMemo(() => {
    if (!apartmentIdValue) return 0;
    const apt = buildingApartments.find((a: Apartment) => a.id === apartmentIdValue) ||
      apartments.find((a: Apartment) => a.id === apartmentIdValue);
    if (!apt) return 0;
    return apt.bedrooms * 2 || 2;
  }, [apartmentIdValue, buildingApartments, apartments]);

  // Initialize form with initial values
  useEffect(() => {
    if (isOpen) {
      reset({
        is_new_tenant: false,
        tenant_id: initialTenantId || null,
        building_id: (role === "MANAGER" ? managerBuildingId : initialBuildingId) as number,
        floor: initialFloor as number,
        apartment_id: initialApartmentId as number,
        start_date: "",
        end_date: "",
        actual_occupants: undefined as unknown as number,
        monthly_rent: 0,
      });
    }
  }, [isOpen, initialTenantId, initialBuildingId, initialApartmentId, initialFloor, role, managerBuildingId, reset]);

  // Auto-fill rent price when apartment is selected
  useEffect(() => {
    if (apartmentIdValue) {
      const apt = buildingApartments.find((a: Apartment) => a.id === apartmentIdValue) ||
        apartments.find((a: Apartment) => a.id === apartmentIdValue);
      if (apt && apt.rental_price) {
        setValue("monthly_rent", apt.rental_price);
      }
    }
  }, [apartmentIdValue, buildingApartments, apartments, setValue]);

  const [saving, setSaving] = useState(false);

  const createMutation = useMutation({
    mutationFn: (data: Partial<ContractFormValues>) => contractService.createContract({
      apartment_id: data.apartment_id,
      tenant_id: data.tenant_id!,
      start_date: data.start_date,
      end_date: data.end_date,
      monthly_rent: data.monthly_rent,
    }), onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRACTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.APARTMENTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TENANTS });
      toast.success("Tạo hợp đồng thành công!");
      onSuccess();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string; error?: string } } };
      toast.error(
        err.response?.data?.message || err.response?.data?.error || "Tạo hợp đồng thất bại!"
      );
    },
    onSettled: () => {
      setSaving(false);
    },
  });

  const handleFormSubmit = handleSubmit(
    (data) => {
      setSaving(true);
      createMutation.mutate(data);
    },
    (errors) => {
      const firstError = Object.values(errors)[0];
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
    saving,
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
  };
}
