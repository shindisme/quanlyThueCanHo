import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../../../stores/auth.store";
import * as buildingService from "../../../../services/buildingService";
import * as apartmentService from "../../../../services/apartmentService";
import * as contractService from "../../../../services/contractService";
import * as invoiceService from "../../../../services/invoiceService";

export function useAdminDashboard() {
  const { email } = useAuthStore();
  const displayName = "Quản trị viên";

  const { data: buildingsData, isLoading: loadingBuildings } = useQuery({
    queryKey: ["buildings"],
    queryFn: () => buildingService.getAllBuildings({ limit: 100 }),
  });
  const buildings = buildingsData?.data || [];

  const { data: apartmentsData, isLoading: loadingApartments } = useQuery({
    queryKey: ["apartments"],
    queryFn: () => apartmentService.getAllApartments({ limit: 100 }),
  });
  const apartments = apartmentsData?.data || [];

  const { data: contractsData, isLoading: loadingContracts } = useQuery({
    queryKey: ["contracts"],
    queryFn: () => contractService.getAllContracts(),
  });
  const contracts = contractsData || [];

  const { data: invoicesData, isLoading: loadingInvoices } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => invoiceService.getAllInvoices({ limit: 100 }),
  });
  const invoices = invoicesData?.data || [];

  const isLoading = loadingBuildings || loadingApartments || loadingContracts || loadingInvoices;

  return {
    email,
    displayName,
    buildings,
    apartments,
    contracts,
    invoices,
    isLoading,
  };
}
