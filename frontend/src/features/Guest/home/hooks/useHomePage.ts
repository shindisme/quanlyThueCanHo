import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as buildingService from "../../../../services/buildingService";
import * as apartmentService from "../../../../services/apartmentService";

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

  const [featuredIds] = useState<number[]>(() => {
    const storedIds = localStorage.getItem("featured-apartment-ids");
    if (storedIds) {
      try {
        return JSON.parse(storedIds) || [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const { data: buildings = [], isLoading: loadingBuildings } = useQuery({
    queryKey: ["buildings"],
    queryFn: () => buildingService.getAllBuildingsPage(),
    select: (res) => res.data,
  });

  const { data: apartments = [], isLoading: loadingApartments } = useQuery({
    queryKey: ["apartments-landing"],
    queryFn: () => apartmentService.getAllApartmentsPage(),
    select: (res) => res.data,
  });

  const loading = loadingBuildings || loadingApartments;

  const featuredApartments = (() => {
    const validStatuses = ["available", "vacant", "AVAILABLE", "rented", "RENTED", "maintenance", "MAINTENANCE"];
    const apts = apartments as any[];
    if (featuredIds.length > 0) {
      const filtered = apts.filter(
        (a) => featuredIds.includes(a.id) && validStatuses.includes(a.status)
      );
      if (filtered.length > 0) return filtered.slice(0, 6);
    }
    return apts.filter((a) => validStatuses.includes(a.status)).slice(0, 6);
  })();

  return {
    searchQuery,
    setSearchQuery,
    heroTitle,
    heroSubtitle,
    buildings,
    loading,
    featuredApartments,
  };
}
