import { useQuery } from "@tanstack/react-query";
import * as contractService from "../../../../services/contractService";
import * as contractTerminationService from "../../../../services/contractTerminationService";
import { queryKeys } from "../../../../constants/queryKeys";
import { useAuthStore } from "../../../../stores/auth.store";
import type { ContractTermination, RentalContract } from "../../../../types";

export function useTenantContracts() {
  const { token } = useAuthStore();

  const contractsQuery = useQuery({
    queryKey: queryKeys.contracts.all,
    queryFn: () => contractService.getAllPage(),
    select: (res) => (res.data || []) as RentalContract[],
    enabled: !!token,
  });

  const terminationsQuery = useQuery<ContractTermination[]>({
    queryKey: queryKeys.terminations.all,
    queryFn: async () => {
      const res = await contractTerminationService.getAllPage();
      return (res.data || []) as ContractTermination[];
    },
    enabled: !!token,
  });

  return {
    contracts: contractsQuery.data || [],
    terminations: terminationsQuery.data || [],
    isLoading: contractsQuery.isLoading || terminationsQuery.isLoading,
    isError: contractsQuery.isError || terminationsQuery.isError,
    refetch: async () => {
      await Promise.all([contractsQuery.refetch(), terminationsQuery.refetch()]);
    },
  };
}
