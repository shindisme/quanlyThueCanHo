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

  const { activeContract, endedContract } = useMemo(() => {
    if (!contracts || contracts.length === 0) {
      return { activeContract: null, endedContract: null };
    }

    const activeContracts = contracts
      .filter((c) => c.status === "ACTIVE")
      .sort((a, b) => new Date(b.created_at || b.start_date || 0).getTime() - new Date(a.created_at || a.start_date || 0).getTime());
    const active = activeContracts[0] || null;

    const endedContracts = contracts
      .filter((c) => c.status === "ENDED")
      .sort((a, b) => new Date(b.end_date || b.created_at || 0).getTime() - new Date(a.end_date || a.created_at || 0).getTime());
    const ended = endedContracts[0] || null;

    return { activeContract: active, endedContract: ended };
  }, [contracts]);

  const currentTenant = activeContract?.tenant || (contracts.length > 0 ? contracts[0].tenant : null);

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
