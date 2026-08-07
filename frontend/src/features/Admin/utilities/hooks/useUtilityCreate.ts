import { useState, useEffect, useCallback } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import * as utilityService from "../../../../services/utilityService";
import type { BuildingData } from "../../../../services/buildingService";
import type { ApartmentData } from "../../../../services/apartmentService";
import { getMonthOptions, getYearOptions, getPreviousMonth } from "../../../../utils/date";
import { getApiErrorMessage } from "../../../../utils/apiError";
import { QUERY_KEYS } from "../../../../constants/queryKeys";
import {
  type UtilityFormData,
  useUtilityOptions,
  buildUtilityPayload,
  validateUtilityPayload,
} from "../utils/utilityForm";

interface UseUtilityCreateProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  buildings: BuildingData[];
  apartments: ApartmentData[];
  preselectedApartment: ApartmentData | null;
  defaultMonth: number;
  defaultYear: number;
  role: string | null;
  managedBuildingId: number | null;
}

type CreatePayload = Parameters<typeof utilityService.create>[0];

export function useUtilityCreate({
  isOpen,
  onClose,
  onSuccess,
  buildings,
  apartments,
  preselectedApartment,
  defaultMonth,
  defaultYear,
  role,
  managedBuildingId,
}: UseUtilityCreateProps) {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<UtilityFormData>({
    buildingId: "",
    floor: "",
    apartmentId: "",
    month: defaultMonth,
    year: defaultYear,
    electricOld: "",
    electricNew: "",
    waterOld: "",
    waterNew: "",
  });

  // Handler cập nhật từng trường dữ liệu form
  const updateFormField = useCallback(<K extends keyof UtilityFormData>(field: K, value: UtilityFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Handler reset form về trạng thái mặc định
  const resetForm = useCallback(() => {
    setFormData({
      buildingId: role !== "ADMIN" && managedBuildingId ? String(managedBuildingId) : "",
      floor: "",
      apartmentId: "",
      month: defaultMonth,
      year: defaultYear,
      electricOld: "",
      electricNew: "",
      waterOld: "",
      waterNew: "",
    });
  }, [role, managedBuildingId, defaultMonth, defaultYear]);

  // Reset và cập nhật form state khi mở modal hoặc thay đổi căn hộ chọn trước
  useEffect(() => {
    if (isOpen) {
      if (preselectedApartment) {
        setFormData({
          buildingId: String(preselectedApartment.building_id),
          floor: String(preselectedApartment.floor),
          apartmentId: String(preselectedApartment.id),
          month: defaultMonth,
          year: defaultYear,
          electricOld: "",
          electricNew: "",
          waterOld: "",
          waterNew: "",
        });
      } else {
        resetForm();
      }
    } else {
      resetForm();
    }
  }, [isOpen, preselectedApartment, defaultMonth, defaultYear, resetForm]);

  // Lấy chỉ số điện nước kỳ trước tự động
  const { previousMonth, previousYear } = getPreviousMonth(formData.month, formData.year);
  const selectedApartmentId = formData.apartmentId ? Number(formData.apartmentId) : null;

  const { data: prevReading } = useQuery({
    queryKey: ["previousUtilityReading", selectedApartmentId, previousMonth, previousYear],
    queryFn: async () => {
      if (!selectedApartmentId) return null;
      const result = await utilityService.getAll({
        apartment_id: selectedApartmentId,
        month: previousMonth,
        year: previousYear,
        limit: 1,
      });
      return result.data[0] || null;
    },
    enabled: isOpen && !!selectedApartmentId,
  });

  useEffect(() => {
    if (!isOpen || !selectedApartmentId) return;
    if (prevReading) {
      setFormData((prev) => ({
        ...prev,
        electricOld: String(Math.round(Number(prevReading.electric_new))),
        waterOld: String(Math.round(Number(prevReading.water_new))),
      }));
    } else if (prevReading === null) {
      setFormData((prev) => ({
        ...prev,
        electricOld: "0",
        waterOld: "0",
      }));
    }
  }, [prevReading, isOpen, selectedApartmentId]);

  const { buildingOptions, floorOptions, modalApartmentOptions } = useUtilityOptions(
    buildings,
    apartments,
    formData.buildingId,
    formData.floor
  );

  const createMutation = useMutation({
    mutationFn: (data: CreatePayload) => utilityService.create(data),
    onSuccess: () => {
      toast.success("Thêm chỉ số điện nước thành công");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.UTILITIES });
      resetForm();
      onSuccess();
      onClose();
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Không thể lưu chỉ số"));
    },
  });

  const handleCreateUtilityReading = () => {
    if (formData.electricOld === "" || formData.waterOld === "") {
      toast.error("Đang lấy chỉ số điện nước kỳ trước");
      return;
    }

    const payload = buildUtilityPayload(formData);
    const validation = validateUtilityPayload(payload);
    if (!validation.success) {
      toast.error(validation.message || "Thông tin không hợp lệ");
      return;
    }

    createMutation.mutate(payload);
  };

  return {
    saving: createMutation.isPending,
    buildingId: formData.buildingId,
    setBuildingId: (val: string) => updateFormField("buildingId", val),
    floor: formData.floor,
    setFloor: (val: string) => updateFormField("floor", val),
    apartmentId: formData.apartmentId,
    setApartmentId: (val: string) => updateFormField("apartmentId", val),
    month: formData.month,
    setMonth: (val: number) => updateFormField("month", val),
    year: formData.year,
    setYear: (val: number) => updateFormField("year", val),
    electricOld: formData.electricOld,
    electricNew: formData.electricNew,
    setElectricNew: (val: string) => updateFormField("electricNew", val),
    waterOld: formData.waterOld,
    waterNew: formData.waterNew,
    setWaterNew: (val: string) => updateFormField("waterNew", val),
    handleCreateUtilityReading,
    getMonthOptions,
    getYearOptions,
    buildingOptions,
    floorOptions,
    modalApartmentOptions,
  };
}
