import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { utilitySchema } from "../../../../schemas/utility.schema";
import * as utilityService from "../../../../services/utilityService";
import type { BuildingData } from "../../../../services/buildingService";
import type { ApartmentData } from "../../../../services/apartmentService";
import { isUtilityTrackedApartment } from "../utils/utilityApartment";
import type { UtilityReadingData } from "../../../../services/utilityService";

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
    mutationFn: ({ id, data }: { id: number; data: Partial<utilityService.UtilityReadingData> }) => utilityService.update(id, data),
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
  const [buildingId, setBuildingId] = useState<string>("");
  const [floor, setFloor] = useState<string>("");
  const [apartmentId, setApartmentId] = useState<string>("");
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [electricOld, setElectricOld] = useState<string>("");
  const [electricNew, setElectricNew] = useState<string>("");
  const [waterOld, setWaterOld] = useState<string>("");
  const [waterNew, setWaterNew] = useState<string>("");

  useEffect(() => {
    if (editItem && isOpen) {
      setBuildingId(String(editItem.apartment?.building_id || ""));
      setFloor(String(editItem.apartment?.floor || ""));
      setApartmentId(String(editItem.apartment_id));
      setMonth(editItem.month);
      setYear(editItem.year);
      setElectricOld(String(Math.round(Number(editItem.electric_old))));
      setElectricNew(String(Math.round(Number(editItem.electric_new))));
      setWaterOld(String(Math.round(Number(editItem.water_old))));
      setWaterNew(String(Math.round(Number(editItem.water_new))));
    }
  }, [editItem, isOpen]);

  function handleUpdateUtilityReading() {
    if (isViewOnly) return;
    if (!editItem) return;
    const payload = {
      apartment_id: Number(apartmentId),
      month: month,
      year: year,
      electric_old: Math.round(Number(electricOld || 0)),
      electric_new: Math.round(Number(electricNew || 0)),
      water_old: Math.round(Number(waterOld || 0)),
      water_new: Math.round(Number(waterNew || 0)),
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
    if (!buildingId) return [];
    const b = buildings.find((x) => x.id === Number(buildingId));
    if (!b) return [];
    return Array.from({ length: b.total_floors }, (_, i) => ({
      value: String(i + 1),
      label: `Tầng ${i + 1}`,
    }));
  })();

  const modalApartmentOptions = apartments
    .filter((apt) => {
      const matchBuilding = !buildingId || apt.building_id === Number(buildingId);
      const matchFloor = !floor || apt.floor === Number(floor);
      const isRented = isUtilityTrackedApartment(apt.status);
      return matchBuilding && matchFloor && isRented;
    })
    .map((apt) => ({
      value: String(apt.id),
      label: `P.${apt.floor}${apt.room_number}`,
    }));

  return {
    saving,
    buildingId,
    setBuildingId,
    floor,
    setFloor,
    apartmentId,
    setApartmentId,
    month,
    setMonth,
    year,
    setYear,
    electricOld,
    setElectricOld,
    electricNew,
    setElectricNew,
    waterOld,
    setWaterOld,
    waterNew,
    setWaterNew,
    handleUpdateUtilityReading,
    getMonthOptions,
    getYearOptions,
    buildingOptions,
    floorOptions,
    modalApartmentOptions,
  };
}
