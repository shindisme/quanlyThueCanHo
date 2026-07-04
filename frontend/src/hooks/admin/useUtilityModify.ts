import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { utilitySchema } from "../../schemas/utility.schema";
import * as utilityService from "../../services/utilityService";
import type { BuildingData } from "../../services/buildingService";
import type { ApartmentData } from "../../services/apartmentService";
import type { UtilityReadingData } from "../../services/utilityService";

interface UseUtilityModifyProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editItem: UtilityReadingData | null;
  isViewOnly: boolean;
  buildings: BuildingData[];
  apartments: ApartmentData[];
}

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
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<utilityService.UtilityReadingData> }) => utilityService.updateUtilityReading(id, data),
    onSuccess: () => {
      toast.success("Cập nhật chỉ số điện nước thành công");
      queryClient.invalidateQueries({ queryKey: ["utilityReadings"] });
      onSuccess();
      onClose();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Gặp lỗi khi lưu chỉ số");
    }
  });
  const saving = updateMutation.isPending;
  const [formBuildingId, setFormBuildingId] = useState<string>("");
  const [formFloor, setFormFloor] = useState<string>("");
  const [formApartmentId, setFormApartmentId] = useState<string>("");
  const [formMonth, setFormMonth] = useState<number>(new Date().getMonth() + 1);
  const [formYear, setFormYear] = useState<number>(new Date().getFullYear());
  const [formElectricOld, setFormElectricOld] = useState<string>("");
  const [formElectricNew, setFormElectricNew] = useState<string>("");
  const [formWaterOld, setFormWaterOld] = useState<string>("");
  const [formWaterNew, setFormWaterNew] = useState<string>("");

  useEffect(() => {
    if (editItem && isOpen) {
      setFormBuildingId(String(editItem.apartment?.building_id || ""));
      setFormFloor(String(editItem.apartment?.floor || ""));
      setFormApartmentId(String(editItem.apartment_id));
      setFormMonth(editItem.month);
      setFormYear(editItem.year);
      setFormElectricOld(String(editItem.electric_old));
      setFormElectricNew(String(editItem.electric_new));
      setFormWaterOld(String(editItem.water_old));
      setFormWaterNew(String(editItem.water_new));
    }
  }, [editItem, isOpen]);

  function handleSave() {
    if (isViewOnly) return;
    if (!editItem) return;
    const payload = {
      apartment_id: Number(formApartmentId),
      month: formMonth,
      year: formYear,
      electric_old: Number(formElectricOld || 0),
      electric_new: Number(formElectricNew || 0),
      water_old: Number(formWaterOld || 0),
      water_new: Number(formWaterNew || 0),
    };

    const validationResult = utilitySchema.safeParse(payload);
    if (!validationResult.success) {
      toast.error(validationResult.error.issues[0].message);
      return;
    }
    updateMutation.mutate({ id: editItem.id, data: payload });
  }

  // Helpers
  const getMonthOptions = () => {
    return Array.from({ length: 12 }).map((_, idx) => ({
      value: String(idx + 1),
      label: `Tháng ${idx + 1}`,
    }));
  };

  const getYearOptions = () => {
    const startYear = 2024;
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = startYear; y <= currentYear + 1; y++) {
      years.push({ value: String(y), label: `Năm ${y}` });
    }
    return years.reverse();
  };

  const buildingOptions = buildings.map((b) => ({
    value: String(b.id),
    label: b.branch_name,
  }));

  const floorOptions = (() => {
    if (!formBuildingId) return [];
    const b = buildings.find((x) => x.id === Number(formBuildingId));
    if (!b) return [];
    return Array.from({ length: b.total_floors }, (_, i) => ({
      value: String(i + 1),
      label: `Tầng ${i + 1}`,
    }));
  })();

  const modalApartmentOptions = apartments
    .filter((apt) => {
      const matchBuilding = !formBuildingId || apt.building_id === Number(formBuildingId);
      const matchFloor = !formFloor || apt.floor === Number(formFloor);
      const isRented = apt.status === "RENTED";
      return matchBuilding && matchFloor && isRented;
    })
    .map((apt) => ({
      value: String(apt.id),
      label: `P.${apt.floor}${apt.room_number}`,
    }));

  return {
    saving,
    formBuildingId,
    setFormBuildingId,
    formFloor,
    setFormFloor,
    formApartmentId,
    setFormApartmentId,
    formMonth,
    setFormMonth,
    formYear,
    setFormYear,
    formElectricOld,
    formElectricNew,
    setFormElectricNew,
    formWaterOld,
    formWaterNew,
    setFormWaterNew,
    handleSave,
    getMonthOptions,
    getYearOptions,
    buildingOptions,
    floorOptions,
    modalApartmentOptions,
  };
}
