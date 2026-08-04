import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { utilitySchema } from "../../../../schemas/utility.schema";
import * as utilityService from "../../../../services/utilityService";
import type { BuildingData } from "../../../../services/buildingService";
import type { ApartmentData } from "../../../../services/apartmentService";

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
  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof utilityService.create>[0]) => utilityService.create(data),
    onSuccess: () => {
      toast.success("Thêm chỉ số điện nước thành công");
      setElectricOld("");
      setElectricNew("");
      setWaterOld("");
      setWaterNew("");
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
  const [buildingId, setBuildingId] = useState<string>("");
  const [floor, setFloor] = useState<string>("");
  const [apartmentId, setApartmentId] = useState<string>("");
  const [month, setMonth] = useState<number>(defaultMonth);
  const [year, setYear] = useState<number>(defaultYear);
  const [electricOld, setElectricOld] = useState<string>("");
  const [electricNew, setElectricNew] = useState<string>("");
  const [waterOld, setWaterOld] = useState<string>("");
  const [waterNew, setWaterNew] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      if (preselectedApartment) {
        setBuildingId(String(preselectedApartment.building_id));
        setFloor(String(preselectedApartment.floor));
        setApartmentId(String(preselectedApartment.id));
      } else {
        const defaultBId = role !== "ADMIN" && managedBuildingId ? String(managedBuildingId) : "";
        setBuildingId(defaultBId);
        setFloor("");
        setApartmentId("");
      }
      setMonth(defaultMonth);
      setYear(defaultYear);
      setElectricOld("");
      setElectricNew("");
      setWaterOld("");
      setWaterNew("");
    }
  }, [isOpen, preselectedApartment, defaultMonth, defaultYear, role, managedBuildingId]);

  // Autofill old indices from the previous month reading.
  useEffect(() => {
    if (!apartmentId || !isOpen) {
      setElectricOld("");
      setWaterOld("");
      return;
    }

    const previousMonth = month === 1 ? 12 : month - 1;
    const previousYear = month === 1 ? year - 1 : year;
    let cancelled = false;

    setElectricOld("");
    setWaterOld("");

    utilityService.getAll({
      apartment_id: Number(apartmentId),
      month: previousMonth,
      year: previousYear,
      limit: 1,
    }).then((result) => {
      if (cancelled) return;

      const previousReading = result.data[0];
      setElectricOld(previousReading ? String(Math.round(Number(previousReading.electric_new))) : "0");
      setWaterOld(previousReading ? String(Math.round(Number(previousReading.water_new))) : "0");
    }).catch((error) => {
      if (cancelled) return;

      console.error(error);
      toast.error("Không thể lấy chỉ số điện nước kỳ trước");
      setElectricOld("0");
      setWaterOld("0");
    });

    return () => {
      cancelled = true;
    };
  }, [apartmentId, isOpen, month, year]);

  function handleCreateUtilityReading() {
    if (electricOld === "" || waterOld === "") {
      toast.error("Đang lấy chỉ số điện nước kỳ trước");
      return;
    }

    const payload = {
      apartment_id: apartmentId ? Number(apartmentId) : 0,
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
      const isRented = apt.status === "RENTED";
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
    electricNew,
    setElectricNew,
    waterOld,
    waterNew,
    setWaterNew,
    handleCreateUtilityReading,
    getMonthOptions,
    getYearOptions,
    buildingOptions,
    floorOptions,
    modalApartmentOptions,
  };
}
