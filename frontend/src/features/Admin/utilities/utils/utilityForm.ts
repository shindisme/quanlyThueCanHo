import { useMemo } from "react";
import type { BuildingData } from "../../../../services/buildingService";
import type { ApartmentData } from "../../../../services/apartmentService";
import { isUtilityTrackedApartment } from "./utilityApartment";
import { utilitySchema } from "../../../../schemas/utility.schema";

export interface UtilityFormData {
  buildingId: string;
  floor: string;
  apartmentId: string;
  month: number;
  year: number;
  electricOld: string;
  electricNew: string;
  waterOld: string;
  waterNew: string;
}

export const INITIAL_UTILITY_FORM_DATA: UtilityFormData = {
  buildingId: "",
  floor: "",
  apartmentId: "",
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  electricOld: "",
  electricNew: "",
  waterOld: "",
  waterNew: "",
};

// Helper tạo danh sách tùy chọn Tòa nhà
export function getBuildingOptions(buildings: BuildingData[]) {
  return buildings.map((b) => ({
    value: String(b.id),
    label: b.branch_name,
  }));
}

// Helper tạo danh sách tùy chọn Tầng theo Tòa nhà được chọn
export function getFloorOptions(buildings: BuildingData[], buildingId: string) {
  if (!buildingId) return [];
  const b = buildings.find((x) => x.id === Number(buildingId));
  if (!b) return [];
  return Array.from({ length: b.total_floors }, (_, i) => ({
    value: String(i + 1),
    label: `Tầng ${i + 1}`,
  }));
}

export function getApartmentOptions(
  apartments: ApartmentData[],
  buildingId: string,
  floor: string
) {
  return apartments
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
}

export function buildUtilityPayload(formData: UtilityFormData) {
  return {
    apartment_id: formData.apartmentId ? Number(formData.apartmentId) : 0,
    month: formData.month,
    year: formData.year,
    electric_old: Math.round(Number(formData.electricOld || 0)),
    electric_new: Math.round(Number(formData.electricNew || 0)),
    water_old: Math.round(Number(formData.waterOld || 0)),
    water_new: Math.round(Number(formData.waterNew || 0)),
  };
}

export type UtilityPayload = ReturnType<typeof buildUtilityPayload>;

// Helper kiểm tra tính hợp lệ dữ liệu nhập
export function validateUtilityPayload(payload: UtilityPayload): { success: boolean; message?: string } {
  const result = utilitySchema.safeParse(payload);
  if (!result.success) {
    return {
      success: false,
      message: result.error.issues[0]?.message || "Thông tin chỉ số điện nước không hợp lệ",
    };
  }
  return { success: true };
}

export function useUtilityOptions(
  buildings: BuildingData[],
  apartments: ApartmentData[],
  buildingId: string,
  floor: string
) {
  const buildingOptions = useMemo(() => getBuildingOptions(buildings), [buildings]);

  const floorOptions = useMemo(
    () => getFloorOptions(buildings, buildingId),
    [buildings, buildingId]
  );

  const modalApartmentOptions = useMemo(
    () => getApartmentOptions(apartments, buildingId, floor),
    [apartments, buildingId, floor]
  );

  return {
    buildingOptions,
    floorOptions,
    modalApartmentOptions,
  };
}
