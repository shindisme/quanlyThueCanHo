import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useUserRole } from "../../../../hooks/useUserRole";
import * as apartmentService from "../../../../services/apartmentService";
import { QUERY_KEYS } from "../../../../constants/queryKeys";
import { getBuildingById } from "../../../../services/buildingService";

export function useBuildingDetail() {
  const { id } = useParams<{ id: string }>();
  const { role } = useUserRole();
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState(1);

  const { data: building, isLoading: loadingBuilding, refetch: fetchBuilding } = useQuery({
    queryKey: [QUERY_KEYS.BUILDINGS[0], id],
    queryFn: () => getBuildingById(Number(id)),
    enabled: !!id,
  });

  const { data: apartments = [], isLoading: loadingApartments, refetch: fetchApartments } = useQuery({
    queryKey: [QUERY_KEYS.APARTMENTS[0], "building", id],
    queryFn: async () => {
      if (!id) return [];
      const res = await apartmentService.getAllApartmentsPage({ building_id: Number(id) });
      return res.data;
    },
    enabled: !!id,
  });

  const loading = loadingBuilding || loadingApartments;

  const fetchData = async () => {
    await Promise.all([fetchBuilding(), fetchApartments()]);
  };

  return {
    id,
    role,
    building,
    apartments,
    loading,
    showModifyModal,
    setShowModifyModal,
    selectedFloor,
    setSelectedFloor,
    fetchData,
  };
}
