import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../../../stores/auth.store";
import * as contractService from "../../../../services/contractService";
import { queryKeys } from "../../../../constants/queryKeys";
import type { RentalContract } from "../../../../types";

export function useTenantApartmentInfo() {
  const { email, token } = useAuthStore();

  const { data: contracts = [], isLoading: loadingContracts } = useQuery({
    queryKey: queryKeys.contracts.all,
    queryFn: () => contractService.getAllPage(),
    select: (res) => (res.data || []) as RentalContract[],
    enabled: !!token,
  });

  const currentTenant = contracts.length > 0 ? contracts[0].tenant : null;

  const { activeContract, endedContract } = useMemo(() => {
    if (!contracts || contracts.length === 0) {
      return { activeContract: null, endedContract: null };
    }
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const active = contracts.find(
      (c) => c.status === "ACTIVE" || new Date(c.end_date) >= todayStart
    ) || null;

    const ended = contracts
      .filter((c) => c.status === "ENDED" && new Date(c.end_date) < todayStart)
      .sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())[0] || null;

    return { activeContract: active, endedContract: ended };
  }, [contracts]);

  const apartment = activeContract?.apartment || null;
  const building = apartment?.building || null;

  const endedApartment = endedContract?.apartment || null;
  const endedBuilding = endedApartment?.building || null;

  const displayName = currentTenant?.full_name || email?.split("@")[0] || "Người thuê";

  return {
    email,
    displayName,
    activeContract,
    apartment,
    building,
    endedContract,
    endedApartment,
    endedBuilding,
    loadingApartmentInfo: loadingContracts,
  };
}
