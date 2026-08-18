import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as buildingService from "../../../../services/buildingService";
import * as apartmentService from "../../../../services/apartmentService";
import { queryKeys } from "../../../../constants/queryKeys";
import { selectAvailableApartmentsByBuilding } from "./homeApartmentSelection";

export function useHomePage() {
  const [searchQuery, setSearchQuery] = useState("");

  const [heroTitle] = useState<string>(() => {
    const storedSettings = localStorage.getItem("landing-page-settings");
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        if (parsed.heroTitle) return parsed.heroTitle;
      } catch { /* empty */ }
    }
    return "Tìm căn hộ lý tưởng của bạn";
  });

  const [heroSubtitle] = useState<string>(() => {
    const storedSettings = localStorage.getItem("landing-page-settings");
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        if (parsed.heroSubtitle) return parsed.heroSubtitle;
      } catch { /* empty */ }
    }
    return "YuKi House cung cấp các căn hộ cho thuê chất lượng cao tại TP. Hồ Chí Minh với đầy đủ tiện nghi, an ninh 24/7 và dịch vụ chuyên nghiệp.";
  });

  const { data: buildings = [], isLoading: loadingBuildings } = useQuery({
    queryKey: queryKeys.buildings.all,
    queryFn: () => buildingService.getAllPage(),
    select: (res) => res.data,
  });

  const { data: apartments = [], isLoading: loadingApartments } = useQuery({
    queryKey: queryKeys.apartments.list({ scope: "landing", status: "AVAILABLE,VACATING_SOON" }),
    queryFn: () => apartmentService.getAllPage({ status: "AVAILABLE,VACATING_SOON" }),
    select: (res) => res.data,
  });

  const loading = loadingBuildings || loadingApartments;

  const availableApartments = selectAvailableApartmentsByBuilding(apartments);

  return {
    searchQuery,
    setSearchQuery,
    heroTitle,
    heroSubtitle,
    buildings,
    loading,
    availableApartments,
  };
}
