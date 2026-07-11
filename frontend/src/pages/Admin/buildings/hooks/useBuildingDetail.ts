import { useParams } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as buildingService from "../../../../services/buildingService";
import * as apartmentService from "../../../../services/apartmentService";
import { useAuthStore } from "../../../../stores/auth.store";

export function useBuildingDetail() {
  const { id } = useParams();
  const { role } = useAuthStore();
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState(1);

  const { data: building, isLoading: loadingBuilding, refetch: fetchBuilding } = useQuery({
    queryKey: ["building", id],
    queryFn: () => buildingService.getBuildingById(Number(id)),
    enabled: !!id,
  });

  const { data: apartments = [], isLoading: loadingApartments, refetch: fetchApartments } = useQuery({
    queryKey: ["building-apartments", id],
    queryFn: async () => {
      if (!id) return [];
      return await apartmentService.getAllApartmentPages({ building_id: Number(id) });
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
