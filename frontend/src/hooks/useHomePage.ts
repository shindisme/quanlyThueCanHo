import { useState, useEffect } from "react";
import * as buildingService from "../services/buildingService";
import * as apartmentService from "../services/apartmentService";
import type { BuildingData } from "../services/buildingService";
import type { ApartmentData } from "../services/apartmentService";

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

  const [apartments, setApartments] = useState<ApartmentData[]>([]);
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      buildingService.getAllBuildings({ limit: 100 }),
      apartmentService.getAllApartments({ limit: featuredIds.length > 0 ? 20 : 6 })
    ])
      .then(([bRes, aRes]) => {
        setBuildings(bRes.data);
        setApartments(aRes.data);
      })
      .catch(() => {
        setBuildings([]);
        setApartments([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [featuredIds]);

  const featuredApartments = (() => {
    if (featuredIds.length > 0) {
      const filtered = apartments.filter(
        (a) => featuredIds.includes(a.id) && ["available", "vacant", "AVAILABLE"].includes(a.status)
      );
      if (filtered.length > 0) return filtered.slice(0, 4);
    }
    return apartments.filter((a) => ["available", "vacant", "AVAILABLE"].includes(a.status)).slice(0, 4);
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
