import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { utilitySchema } from "../../schemas/utility.schema";
import * as utilityService from "../../services/utilityService";
import type { BuildingData } from "../../services/buildingService";
import type { ApartmentData } from "../../services/apartmentService";
import type { UtilityReadingData } from "../../services/utilityService";

interface UseUtilityCreateProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  buildings: BuildingData[];
  apartments: ApartmentData[];
  readings: UtilityReadingData[];
  preselectedApartment: ApartmentData | null;
  defaultMonth: number;
  defaultYear: number;
  role: string | null;
  managedBuildingId: number | null;
}

export function useUtilityCreate({
  isOpen,
  onClose,
  onSuccess,
  buildings,
  apartments,
  readings,
  preselectedApartment,
  defaultMonth,
  defaultYear,
  role,
  managedBuildingId,
}: UseUtilityCreateProps) {
  const queryClient = useQueryClient();
  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof utilityService.createUtilityReading>[0]) => utilityService.createUtilityReading(data),
    onSuccess: () => {
      toast.success("Thêm chỉ số điện nước thành công");
      setFormElectricOld("");
      setFormElectricNew("");
      setFormWaterOld("");
      setFormWaterNew("");
      queryClient.invalidateQueries({ queryKey: ["utilityReadings"] });
      onSuccess();
      onClose();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Không thể lưu chỉ số");
    }
  });
  const saving = createMutation.isPending;
  const [formBuildingId, setFormBuildingId] = useState<string>("");
  const [formFloor, setFormFloor] = useState<string>("");
  const [formApartmentId, setFormApartmentId] = useState<string>("");
  const [formMonth, setFormMonth] = useState<number>(defaultMonth);
  const [formYear, setFormYear] = useState<number>(defaultYear);
  const [formElectricOld, setFormElectricOld] = useState<string>("");
  const [formElectricNew, setFormElectricNew] = useState<string>("");
  const [formWaterOld, setFormWaterOld] = useState<string>("");
  const [formWaterNew, setFormWaterNew] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      if (preselectedApartment) {
        setFormBuildingId(String(preselectedApartment.building_id));
        setFormFloor(String(preselectedApartment.floor));
        setFormApartmentId(String(preselectedApartment.id));
      } else {
        const defaultBId = role !== "ADMIN" && managedBuildingId ? String(managedBuildingId) : "";
        setFormBuildingId(defaultBId);
        setFormFloor("");
        setFormApartmentId("");
      }
      setFormMonth(defaultMonth);
      setFormYear(defaultYear);
      setFormElectricOld("");
      setFormElectricNew("");
      setFormWaterOld("");
      setFormWaterNew("");
    }
  }, [isOpen, preselectedApartment, defaultMonth, defaultYear, role, managedBuildingId]);

  // Autofill old indices when formApartmentId changes
  useEffect(() => {
    if (formApartmentId && isOpen) {
      const aptReadings = readings
        .filter((r) => r.apartment_id === Number(formApartmentId))
        .sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return b.month - a.month;
        });

      if (aptReadings.length > 0) {
        setFormElectricOld(String(aptReadings[0].electric_new));
        setFormWaterOld(String(aptReadings[0].water_new));
      } else {
        setFormElectricOld("0");
        setFormWaterOld("0");
      }
    }
  }, [formApartmentId, isOpen, readings]);

  function handleSave() {
    const payload = {
      apartment_id: formApartmentId ? Number(formApartmentId) : 0,
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
    createMutation.mutate(payload);
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
