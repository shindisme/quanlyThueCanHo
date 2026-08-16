import { useState, useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as utilityService from "../../../../services/utilityService";
import type { BuildingData } from "../../../../services/buildingService";
import type { ApartmentData } from "../../../../services/apartmentService";
import type { UtilityReadingData } from "../../../../services/utilityService";
import { getMonthOptions, getYearOptions } from "../../../../utils/date";
import { getApiErrorMessage } from "../../../../utils/apiError";
import { queryKeys } from "../../../../constants/queryKeys";
import {
  type UtilityFormData,
  INITIAL_UTILITY_FORM_DATA,
  useUtilityOptions,
  buildUtilityPayload,
  validateUtilityPayload,
} from "../utils/utilityForm";

interface UseUtilityModifyProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editItem: UtilityReadingData | null;
  isViewOnly: boolean;
  buildings: BuildingData[];
  apartments: ApartmentData[];
}

type UpdatePayload = Partial<utilityService.UtilityReadingData>;

export function useUtilityModify({
  isOpen,
  onClose,
  onSuccess,
  editItem,
  isViewOnly,
  buildings,
  apartments,
}: UseUtilityModifyProps) {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<UtilityFormData>(INITIAL_UTILITY_FORM_DATA);

  const updateFormField = useCallback(<K extends keyof UtilityFormData>(field: K, value: UtilityFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(INITIAL_UTILITY_FORM_DATA);
  }, []);

  useEffect(() => {
    if (editItem && isOpen) {
      setFormData({
        buildingId: String(editItem.apartment?.building_id || ""),
        floor: String(editItem.apartment?.floor || ""),
        apartmentId: String(editItem.apartment_id),
        month: editItem.month,
        year: editItem.year,
        electricOld: String(Math.round(Number(editItem.electric_old))),
        electricNew: String(Math.round(Number(editItem.electric_new))),
        waterOld: String(Math.round(Number(editItem.water_old))),
        waterNew: String(Math.round(Number(editItem.water_new))),
      });
    } else {
      resetForm();
    }
  }, [editItem, isOpen, resetForm]);

  const { buildingOptions, floorOptions, modalApartmentOptions } = useUtilityOptions(
    buildings,
    apartments,
    formData.buildingId,
    formData.floor
  );

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePayload }) =>
      utilityService.update(id, data),
    onSuccess: () => {
      toast.success("Cập nhật chỉ số điện nước thành công");
      queryClient.invalidateQueries({ queryKey: queryKeys.utilities.all });
      resetForm();
      onSuccess();
      onClose();
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Gặp lỗi khi lưu chỉ số"));
    },
  });

  const handleUpdateUtilityReading = () => {
    if (isViewOnly || !editItem) return;

    const payload = buildUtilityPayload(formData);
    const validation = validateUtilityPayload(payload);
    if (!validation.success) {
      toast.error(validation.message || "Thông tin không hợp lệ");
      return;
    }

    updateMutation.mutate({ id: editItem.id, data: payload });
  };

  return {
    saving: updateMutation.isPending,
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
    setElectricOld: (val: string) => updateFormField("electricOld", val),
    electricNew: formData.electricNew,
    setElectricNew: (val: string) => updateFormField("electricNew", val),
    waterOld: formData.waterOld,
    setWaterOld: (val: string) => updateFormField("waterOld", val),
    waterNew: formData.waterNew,
    setWaterNew: (val: string) => updateFormField("waterNew", val),
    handleUpdateUtilityReading,
    getMonthOptions,
    getYearOptions,
    buildingOptions,
    floorOptions,
    modalApartmentOptions,
  };
}
