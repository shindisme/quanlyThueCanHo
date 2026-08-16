import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import * as buildingService from "../../../../services/buildingService";
import * as apartmentService from "../../../../services/apartmentService";
import { useDebounce } from "../../../../hooks/useDebounce";
import { queryKeys } from "../../../../constants/queryKeys";
import { removeVietnameseTones } from "../../../../utils/string";
import {
  findBuildingsWithinRadiusAsync,
  geocodeLocationSearch,
  getLocationSuggestionMessage,
  isNonHCMCQuery,
  normalizeLocationText,
} from "../../../../utils/locationSearch";

type LocationSuggestion = {
  search: string;
  buildingIds: number[];
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
  const locationParamVal = searchParams.get("location");
  const isLocationSearch = locationParamVal !== null;
  const searchParamVal = locationParamVal ?? searchParams.get("search") ?? "";

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
    queryKey: queryKeys.buildings.all,
    queryFn: () => buildingService.getAllPage(),
    select: (res) => res.data,
  });

  const { data: apartments = [], isLoading: loadingApartments } = useQuery({
    queryKey: queryKeys.apartments.list({ scope: "guest", buildingFilter }),
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
    if (isLocationSearch) {
      const locationTerm = normalizeLocationText(debouncedSearch);
      if (!locationTerm) return true;

      return [building?.address, building?.branch_name, building?.name]
        .some((value) => normalizeLocationText(value || "").includes(locationTerm));
    }

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
      buildings.length === 0
    ) {
      setLocationSearching(false);
      return;
    }

    if (isNonHCMCQuery(searchText)) {
      setLocationSearching(false);
      setLocationSuggestion({
        search: searchText,
        buildingIds: [],
        message: getLocationSuggestionMessage(searchText, undefined, true, true),
      });
      return;
    }

    if (exactFiltered.length > 0) {
      setLocationSearching(false);
      return;
    }

    setLocationSearching(true);
    geocodeLocationSearch(searchText, import.meta.env.VITE_MAPBOX_ACCESS_TOKEN)
      .then(async (geocodedLocation) => {
        if (cancelled) return;

        if (!geocodedLocation || !geocodedLocation.isInHCMC) {
          setLocationSuggestion({
            search: searchText,
            buildingIds: [],
            message: getLocationSuggestionMessage(searchText, undefined, true, true),
          });
          return;
        }

        const nearbyBuildings = await findBuildingsWithinRadiusAsync(
          geocodedLocation.coordinates,
          buildings,
          import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
          15
        );
        if (cancelled) return;

        setLocationSuggestion({
          search: searchText,
          buildingIds: nearbyBuildings.map((result) => result.building.id),
          message: getLocationSuggestionMessage(
            searchText,
            nearbyBuildings[0]?.distanceKm,
            nearbyBuildings.length > 0
          ),
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

  const suggestedBuildingIds = new Set(activeLocationSuggestion?.buildingIds ?? []);
  const suggestedFiltered = suggestedBuildingIds.size > 0
    ? filteredByControls.filter(
      (apartment) => suggestedBuildingIds.has(apartment.building_id)
    )
    : [];

  const isUsingLocationSuggestion =
    !!activeLocationSuggestion &&
    exactFiltered.length === 0 &&
    suggestedFiltered.length > 0;

  const isRejectedLocation = !!activeLocationSuggestion && suggestedBuildingIds.size === 0;
  const filtered = isRejectedLocation
    ? []
    : isUsingLocationSuggestion
      ? suggestedFiltered
      : exactFiltered;

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
