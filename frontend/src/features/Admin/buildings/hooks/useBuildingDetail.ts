import { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useUserRole } from "../../../../hooks/useUserRole";
import * as apartmentService from "../../../../services/apartmentService";
import { QUERY_KEYS } from "../../../../constants/queryKeys";
import type { Apartment } from "../../../../types";
import { buildingService } from "../../../../services";

export function useBuildingDetail() {
  const { id } = useParams<{ id: string }>();
  const buildingId = Number(id);
  const { role } = useUserRole();
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [showCreateApartmentModal, setShowCreateApartmentModal] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState(1);

  const baseRoute = role === "MANAGER" ? "/manager" : "/admin";
  const canEdit = role === "ADMIN" || role === "MANAGER";

  // Get info building
  const {
    data: building,
    isLoading: loadingBuilding,
    isError: isErrorBuilding,
    refetch: refetchBuilding,
  } = useQuery({
    queryKey: [...QUERY_KEYS.BUILDINGS, id],
    queryFn: () => buildingService.getById(buildingId),
    enabled: Boolean(id) && !isNaN(buildingId),
  });

  // Lấy danh sách căn hộ thuộc tòa nhà
  const {
    data: apartments = [],
    isLoading: loadingApartments,
    isError: isErrorApartments,
    refetch: refetchApartments,
  } = useQuery({
    queryKey: [...QUERY_KEYS.APARTMENTS, "building", id],
    queryFn: () => apartmentService.getAllPage({ building_id: buildingId }),
    select: (res) => res.data,
    enabled: Boolean(id) && !isNaN(buildingId),
  });

  const loading = loadingBuilding || loadingApartments;
  const isError = isErrorBuilding || isErrorApartments;

  // Đảm bảo selectedFloor không vượt quá total_floors khi số tầng thay đổi
  useEffect(() => {
    if (building?.total_floors && selectedFloor > building.total_floors) {
      setSelectedFloor(building.total_floors > 0 ? building.total_floors : 1);
    }
  }, [building?.total_floors, selectedFloor]);

  // Thống kê 1 vòng lặp 
  const statistics = useMemo(() => {
    const total = apartments.length;
    let rentedCount = 0;
    let availableCount = 0;

    for (const a of apartments) {
      if (a.status === "RENTED") rentedCount++;
      else if (a.status === "AVAILABLE") availableCount++;
    }

    const occupancyRate = total > 0 ? Math.round((rentedCount / total) * 100) : 0;

    return {
      total,
      rentedCount,
      availableCount,
      occupancyRate,
    };
  }, [apartments]);

  // Mảng danh sách các tầng
  const floors = useMemo(() => {
    const totalFloors = building?.total_floors || 0;
    return Array.from({ length: totalFloors }, (_, i) => i + 1);
  }, [building?.total_floors]);

  // Map căn hộ theo từng tầng O(N)
  const floorApartmentsMap = useMemo(() => {
    const map: Record<number, Apartment[]> = {};
    for (const apt of apartments) {
      const f = apt.floor;
      if (!map[f]) map[f] = [];
      map[f].push(apt);
    }
    return map;
  }, [apartments]);

  // Danh sách căn hộ thuộc tầng hiện tại đang chọn
  const selectedFloorApartments = useMemo(
    () => floorApartmentsMap[selectedFloor] || [],
    [floorApartmentsMap, selectedFloor]
  );

  const refetch = () => {
    refetchBuilding();
    refetchApartments();
  };

  return {
    id,
    role,
    canEdit,
    baseRoute,
    building,
    apartments,
    selectedFloorApartments,
    floorApartmentsMap,
    floors,
    statistics,
    loading,
    isError,
    showModifyModal,
    setShowModifyModal,
    showCreateApartmentModal,
    setShowCreateApartmentModal,
    selectedFloor,
    setSelectedFloor,
    refetch,
  };
}
