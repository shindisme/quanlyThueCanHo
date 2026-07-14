import { useQuery } from "@tanstack/react-query";
import * as contractService from "../../../../services/contractService";
import * as utilityService from "../../../../services/utilityService";

export function useTenantUtilities() {
  const { data: contracts = [], isLoading: loadingContracts } = useQuery({
    queryKey: ["tenant", "active-contracts"],
    queryFn: () => contractService.getAllContractPages({ status: "ACTIVE" }),
  });

  const activeContract = contracts[0] || null;

  const { data: readings = [], isLoading: loadingReadings } = useQuery({
    queryKey: ["tenant", "utility-readings", activeContract?.id],
    queryFn: () => utilityService.getMyUtilityReadingPages(),
    enabled: !!activeContract,
  });

  return {
    apartment: activeContract?.apartment || readings[0]?.apartment || null,
    readings,
    activeContract,
    isLoading: loadingContracts || (!!activeContract && loadingReadings),
  };
}