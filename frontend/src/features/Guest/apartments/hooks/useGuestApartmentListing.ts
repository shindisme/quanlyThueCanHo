import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import * as buildingService from "../../../../services/buildingService";
import * as apartmentService from "../../../../services/apartmentService";
import { useDebounce } from "../../../../hooks/useDebounce";
import { removeVietnameseTones } from "../../../../utils/string";
import {
  findNearestBuildingAsync,
  geocodeSearchText,
  getLocationSuggestionMessage,
  isCoordinatesInHCMC,
  isNonHCMCQuery,
} from "../../../../utils/locationSearch";

type LocationSuggestion = {
  search: string;
  buildingId: number;
  message: string;
};

async function getGuestApartments(buildingId?: number) {
  const apartments: apartmentService.ApartmentData[] = [];
  let page = 1;
  let totalPages: number;

  do {
    const res = await apartmentService.getAll({
      building_id: buildingId,
      limit: 100,
      page,
    });
    apartments.push(...res.data);
    totalPages = res.pagination.totalPages;
    page += 1;
  } while (page <= totalPages);

  return apartments.filter(
    (apartment, index, self) =>
      self.findIndex((item) => item.id === apartment.id) === index
  );
}

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
  const [locationSuggestion, setLocationSuggestion] = useState<LocationSuggestion | null>(null);
  const [locationSearching, setLocationSearching] = useState(false);

  const { data: buildings = [], isLoading: loadingBuildings } = useQuery({
    queryKey: ["buildings"],
    queryFn: () => buildingService.getAllPage(),
    select: (res) => res.data,
  });

  const { data: apartments = [], isLoading: loadingApartments } = useQuery({
    queryKey: ["guest-apartments", buildingFilter],
    queryFn: async () => {
      const bId = buildingFilter ? Number(buildingFilter) : undefined;
      return getGuestApartments(bId);
    },
  });

  const loading = loadingBuildings || loadingApartments;

  const floors = (() => {
    if (!buildingFilter) return [];
    const building = buildings.find((b) => b.id === Number(buildingFilter));
    if (!building) return [];
    return Array.from({ length: building.total_floors }, (_, i) => i + 1);
  })();

  const filteredByControls = apartments.filter((a) => {
    if (buildingFilter && a.building_id !== Number(buildingFilter)) {
      return false;
    }

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

    return matchPrice && matchFloor && matchStatus;
  });

  const exactFiltered = filteredByControls.filter((a) => {
    const building = buildings.find((b) => b.id === a.building_id);
    const term = removeVietnameseTones(debouncedSearch);
    const roomNorm = removeVietnameseTones(a.room_number);
    const descNorm = removeVietnameseTones(a.description || "");
    const buildingNameNorm = removeVietnameseTones(building?.name || "");
    const branchNameNorm = removeVietnameseTones(building?.branch_name || "");
    const addressNorm = removeVietnameseTones(building?.address || "");

    return (
      roomNorm.includes(term) ||
      descNorm.includes(term) ||
      buildingNameNorm.includes(term) ||
      branchNameNorm.includes(term) ||
      addressNorm.includes(term)
    );
  });

  useEffect(() => {
    let cancelled = false;
    const searchText = debouncedSearch.trim();

    setLocationSuggestion(null);
    if (
      !searchText ||
      buildingFilter ||
      loading ||
      exactFiltered.length > 0 ||
      buildings.length === 0
    ) {
      setLocationSearching(false);
      return;
    }

    // Nếu tìm kiếm chứa từ khóa tỉnh thành ngoài TP.HCM
    if (isNonHCMCQuery(searchText)) {
      setLocationSearching(false);
      setLocationSuggestion({
        search: searchText,
        buildingId: 0,
        message: getLocationSuggestionMessage(searchText, undefined, true, true),
      });
      return;
    }

    setLocationSearching(true);
    geocodeSearchText(searchText, import.meta.env.VITE_MAPBOX_ACCESS_TOKEN)
      .then(async (coordinates) => {
        if (cancelled) return;

        // Nếu tọa độ trả về nằm ngoài phạm vi địa lý TP.HCM
        if (!coordinates || !isCoordinatesInHCMC(coordinates)) {
          setLocationSuggestion({
            search: searchText,
            buildingId: 0,
            message: getLocationSuggestionMessage(searchText, undefined, true, true),
          });
          return;
        }

        const result = await findNearestBuildingAsync(
          coordinates,
          buildings,
          import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
          15
        );
        if (!result) return;

        setLocationSuggestion({
          search: searchText,
          buildingId: result.building.id,
          message: getLocationSuggestionMessage(searchText, result.distanceKm, result.isWithinRange),
        });
      })
      .finally(() => {
        if (!cancelled) setLocationSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [buildings, buildingFilter, debouncedSearch, exactFiltered.length, loading]);

  const activeLocationSuggestion =
    locationSuggestion?.search === debouncedSearch.trim()
      ? locationSuggestion
      : null;

  const suggestedFiltered = (activeLocationSuggestion && activeLocationSuggestion.buildingId > 0)
    ? filteredByControls.filter(
      (apartment) => apartment.building_id === activeLocationSuggestion.buildingId
    )
    : [];

  const isUsingLocationSuggestion =
    !!activeLocationSuggestion &&
    exactFiltered.length === 0 &&
    suggestedFiltered.length > 0;

  const filtered = isUsingLocationSuggestion ? suggestedFiltered : exactFiltered;

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
    locationSearching,
    locationSuggestionMessage: activeLocationSuggestion
      ? activeLocationSuggestion.message
      : "",
  };
}
