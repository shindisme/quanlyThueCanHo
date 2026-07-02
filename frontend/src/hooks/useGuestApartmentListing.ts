import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import * as buildingService from "../services/buildingService";
import * as apartmentService from "../services/apartmentService";
import { useDebounce } from "./common/useDebounce";
import { removeVietnameseTones } from "../utils/string";

export function useGuestApartmentListing() {
  const [searchParams] = useSearchParams();
  const searchParamVal = searchParams.get("search") || "";

  const [search, setSearch] = useState(searchParamVal);
  const debouncedSearch = useDebounce(search, 300);
  const [prevSearchParamVal, setPrevSearchParamVal] = useState(searchParamVal);
  if (searchParamVal !== prevSearchParamVal) {
    setSearch(searchParamVal);
    setPrevSearchParamVal(searchParamVal);
  }

  const [priceFilter, setPriceFilter] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("");
  const [floorFilter, setFloorFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("AVAILABLE");

  const { data: buildingsRes, isLoading: loadingBuildings } = useQuery({
    queryKey: ["buildings"],
    queryFn: () => buildingService.getAllBuildings({ limit: 100 }),
  });
  const buildings = buildingsRes?.data || [];

  useEffect(() => {
    if (buildings.length > 0 && !buildingFilter) {
      setBuildingFilter(String(buildings[0].id));
    }
  }, [buildings, buildingFilter]);

  const { data: apartments = [], isLoading: loadingApartments } = useQuery({
    queryKey: ["guest-apartments", buildingFilter],
    queryFn: async () => {
      const bId = buildingFilter ? Number(buildingFilter) : undefined;
      const [res1, res2] = await Promise.all([
        apartmentService.getAllApartments({ building_id: bId, limit: 100, page: 1 }),
        apartmentService.getAllApartments({ building_id: bId, limit: 100, page: 2 }),
      ]);
      const combined = [...res1.data, ...res2.data];
      return combined.filter((a, index, self) => self.findIndex(t => t.id === a.id) === index);
    },
    enabled: !!buildingFilter,
  });

  const loading = loadingBuildings || loadingApartments;

  const floors = (() => {
    if (!buildingFilter) return [];
    const building = buildings.find((b) => b.id === Number(buildingFilter));
    if (!building) return [];
    return Array.from({ length: building.total_floors }, (_, i) => i + 1);
  })();

  const filtered = apartments.filter((a) => {
    const building = buildings.find((b) => b.id === a.building_id);
    const term = removeVietnameseTones(debouncedSearch);
    const roomNorm = removeVietnameseTones(a.room_number);
    const descNorm = removeVietnameseTones(a.description || "");
    const buildingNameNorm = removeVietnameseTones(building?.name || "");
    const branchNameNorm = removeVietnameseTones(building?.branch_name || "");
    const addressNewNorm = removeVietnameseTones(building?.address_new || "");
    const addressOldNorm = removeVietnameseTones(building?.address_old || "");

    const matchSearch =
      roomNorm.includes(term) ||
      descNorm.includes(term) ||
      buildingNameNorm.includes(term) ||
      branchNameNorm.includes(term) ||
      addressNewNorm.includes(term) ||
      addressOldNorm.includes(term);

    const price = a.rental_price;
    let matchPrice = true;
    if (priceFilter === "low") {
      matchPrice = price <= 6000000;
    } else if (priceFilter === "mid") {
      matchPrice = price > 6000000 && price <= 15000000;
    } else if (priceFilter === "high") {
      matchPrice = price > 15000000;
    }

    const matchFloor = !floorFilter || a.floor === Number(floorFilter);
    const matchStatus = !statusFilter || a.status === statusFilter;

    return matchSearch && matchPrice && matchFloor && matchStatus;
  });

  return {
    search,
    setSearch,
    priceFilter,
    setPriceFilter,
    buildingFilter,
    setBuildingFilter,
    floorFilter,
    setFloorFilter,
    statusFilter,
    setStatusFilter,
    buildings,
    loading,
    floors,
    filtered,
  };
}
