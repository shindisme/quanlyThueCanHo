import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import * as buildingService from "../../../../services/buildingService";
import * as apartmentService from "../../../../services/apartmentService";
import { useDebounce } from "../../../../hooks/useDebounce";
import { queryKeys } from "../../../../constants/queryKeys";
import { removeVietnameseTones } from "../../../../utils/string";
import {
  findNearestBuildingAsync,
  geocodeLocationSearch,
  getLocationSuggestionMessage,
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
  const [statusFilter, setStatusFilter] = useState("");
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

  const filteredByControls = useMemo(() => apartments.filter((a) => {
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
  }), [apartments, buildingFilter, floorFilter, priceFilter, statusFilter]);

  const locationTerm = normalizeLocationText(debouncedSearch);
  const exactLocationBuildings = useMemo(
    () => locationTerm
      ? buildings.filter((building) =>
        [building.address, building.branch_name, building.name]
          .some((value) => normalizeLocationText(value || "").includes(locationTerm))
      )
      : [],
    [buildings, locationTerm]
  );
  const exactLocationBuildingIds = new Set(
    exactLocationBuildings.map((building) => building.id)
  );

  const exactFiltered = filteredByControls.filter((a) => {
    const building = buildings.find((b) => b.id === a.building_id);
    if (isLocationSearch) {
      if (!locationTerm) return true;
      return exactLocationBuildingIds.has(a.building_id);
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

  const hasExactSearchMatch = exactFiltered.length > 0;

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

    if (hasExactSearchMatch) {
      setLocationSearching(false);
      return;
    }

    setLocationSearching(true);
    const matchedBuildingAddress = exactLocationBuildings.find(
      (building) => building.address.trim().length > searchText.length
    )?.address;
    const geocodingText = matchedBuildingAddress || searchText;

    geocodeLocationSearch(geocodingText, import.meta.env.VITE_MAPBOX_ACCESS_TOKEN)
      .then(async (geocodedLocation) => {
        if (cancelled) return;

        if (!geocodedLocation) {
          setLocationSuggestion({
            search: searchText,
            buildingIds: [],
            message: getLocationSuggestionMessage(searchText, { isUnresolved: true }),
          });
          return;
        }

        if (!geocodedLocation.isInServiceArea) {
          setLocationSuggestion({
            search: searchText,
            buildingIds: [],
            message: getLocationSuggestionMessage(searchText, { isOutsideServiceArea: true }),
          });
          return;
        }

        const buildingIdsWithApartments = new Set(
          filteredByControls.map((apartment) => apartment.building_id)
        );
        const candidateBuildings = buildings.filter((building) =>
          buildingIdsWithApartments.has(building.id)
        );
        const nearestBuilding = await findNearestBuildingAsync(
          geocodedLocation.coordinates,
          candidateBuildings,
          15
        );
        if (cancelled) return;

        setLocationSuggestion({
          search: searchText,
          buildingIds: nearestBuilding ? [nearestBuilding.building.id] : [],
          message: getLocationSuggestionMessage(searchText, {
            nearestBranchName: nearestBuilding?.building.branch_name,
          }),
        });
      })
      .finally(() => {
        if (!cancelled) setLocationSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    buildings,
    buildingFilter,
    debouncedSearch,
    exactLocationBuildings,
    filteredByControls,
    hasExactSearchMatch,
    loading,
  ]);

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
