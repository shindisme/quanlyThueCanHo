import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../stores/auth.store";
import * as contractService from "../../services/contractService";
import * as apartmentService from "../../services/apartmentService";
import * as buildingService from "../../services/buildingService";
import * as tenantService from "../../services/tenantService";
import type { TenantOccupant } from "../../types";

function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function toOccupant(occupant: TenantOccupant) {
  return {
    id: occupant.id,
    name: occupant.full_name,
    cccd: occupant.citizen_id,
    dob: occupant.date_of_birth?.slice(0, 10) || "",
    phone: occupant.phone || "",
  };
}

export function useTenantHome() {
  const { email, token } = useAuthStore();

  const decoded = token ? parseJwt(token) : null;
  const userId = decoded ? (decoded.userId ? Number(decoded.userId) : (decoded.sub ? Number(decoded.sub) : null)) : null;

  const { data: occupantData = [], isLoading: loadingOccupants } = useQuery({
    queryKey: ["tenant-occupants"],
    queryFn: tenantService.getMyOccupants,
    enabled: !!token,
  });
  const occupants = useMemo(
    () => occupantData.map(toOccupant),
    [occupantData]
  );

  const { data: contracts, isLoading: loadingContracts } = useQuery({
    queryKey: ["contracts"],
    queryFn: () => contractService.getAllContracts(),
    enabled: !!userId,
  });

  const currentTenant = contracts && contracts.length > 0
    ? contracts[0].tenant
    : null;

  const activeContract = contracts
    ? contracts.find((c) => c.status === "ACTIVE")
    : null;

  const { data: apartmentsRes, isLoading: loadingApartments } = useQuery({
    queryKey: ["apartments"],
    queryFn: () => apartmentService.getAllApartments({ limit: 100 }),
    enabled: !!activeContract,
  });

  const apartment = activeContract && apartmentsRes?.data
    ? apartmentsRes.data.find((a) => a.id === activeContract.apartment_id)
    : null;

  const { data: buildingsRes, isLoading: loadingBuildings } = useQuery({
    queryKey: ["buildings"],
    queryFn: () => buildingService.getAllBuildings({ limit: 100 }),
    enabled: !!apartment,
  });

  const building = apartment && buildingsRes?.data
    ? buildingsRes.data.find((b) => b.id === apartment.building_id)
    : null;

  const displayName = currentTenant?.full_name || email?.split("@")[0] || "Người thuê";

  const isLoading = loadingOccupants || loadingContracts || (!!activeContract && loadingApartments) || (!!apartment && loadingBuildings);

  return {
    email,
    displayName,
    occupants,
    activeContract,
    apartment,
    building,
    isLoading,
  };
}