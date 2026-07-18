import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as contractService from "../../../../services/contractService";
import * as apartmentService from "../../../../services/apartmentService";
import * as tenantService from "../../../../services/tenantService";
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
  onClose: _onClose,
  onSuccess,
  currentUser: _currentUser,
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
    watch,
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
      deposit_amount: 0,
    },
  });

  const isNewTenant = watch("is_new_tenant");
  const tenantIdValue = watch("tenant_id");
  const buildingIdValue = watch("building_id");
  const floorValue = watch("floor");
  const apartmentIdValue = watch("apartment_id");
  const newTenantDobValue = watch("new_tenant_dob");
  const startDateValue = watch("start_date");
  const endDateValue = watch("end_date");
  const actualOccupantsValue = watch("actual_occupants");
  const monthlyRentValue = watch("monthly_rent");
  const depositAmountValue = watch("deposit_amount");

  // Fetch apartments for the selected building
  const { data: buildingApartments = [], isLoading: loadingApartments } = useQuery({
    queryKey: ["apartments", "building", buildingIdValue],
    queryFn: () => apartmentService.getAllApartmentsPage({ building_id: buildingIdValue }),
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
    return apts.filter(
      (a: Apartment) => a.floor === floorValue && a.status === "AVAILABLE"
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
        deposit_amount: 0,
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
        setValue("deposit_amount", apt.rental_price);
      }
    }
  }, [apartmentIdValue, buildingApartments, apartments, setValue]);

  const [saving, setSaving] = useState(false);

  const createMutation = useMutation({
    mutationFn: (data: Partial<ContractFormValues>) => {
      if (data.is_new_tenant) {
        // Create new tenant first, then contract
        return tenantService.createTenant({
          full_name: data.new_tenant_name || "",
          citizen_id: data.new_tenant_cccd || "",
          date_of_birth: data.new_tenant_dob || undefined,
          email: data.new_tenant_email || undefined,
          phone: data.new_tenant_phone || undefined,
          permanent_address: data.new_tenant_address || undefined,
        } as Parameters<typeof tenantService.createTenant>[0]).then((tenantRes) => {
          const tenantId = tenantRes.id;
          return contractService.createContract({
            apartment_id: data.apartment_id,
            tenant_id: tenantId,
            start_date: data.start_date,
            end_date: data.end_date,
            monthly_rent: data.monthly_rent,
            deposit_amount: data.deposit_amount,
          });
        });
      }
      return contractService.createContract({
        apartment_id: data.apartment_id,
        tenant_id: data.tenant_id!,
        start_date: data.start_date,
        end_date: data.end_date,
        monthly_rent: data.monthly_rent,
        deposit_amount: data.deposit_amount,
      });
    },
    onSuccess: () => {
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

  const handleFormSubmit = handleSubmit((data) => {
    setSaving(true);
    createMutation.mutate(data);
  });

  return {
    register,
    handleFormSubmit,
    setValue,
    errors,
    saving,
    loadingApartments,
    isNewTenant,
    tenantIdValue,
    buildingIdValue,
    floorValue,
    apartmentIdValue,
    newTenantDobValue,
    startDateValue,
    endDateValue,
    formFloors,
    formApartments,
    actualOccupantsValue,
    monthlyRentValue,
    depositAmountValue,
    maxOccupants,
    buildingApartments,
  };
}
