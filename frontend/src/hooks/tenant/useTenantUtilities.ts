import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../stores/auth.store";
import * as contractService from "../../services/contractService";
import * as apartmentService from "../../services/apartmentService";
import * as invoiceService from "../../services/invoiceService";

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

export function useTenantUtilities() {
  const { token } = useAuthStore();

  const decoded = token ? parseJwt(token) : null;
  const userId = decoded ? (decoded.userId ? Number(decoded.userId) : (decoded.sub ? Number(decoded.sub) : null)) : null;

  const { data: contracts, isLoading: loadingContracts } = useQuery({
    queryKey: ["contracts"],
    queryFn: () => contractService.getAllContracts(),
    enabled: !!userId,
  });
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

  const { data: invoicesRes, isLoading: loadingInvoices } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => invoiceService.getAllInvoices({ limit: 100 }),
    enabled: !!activeContract,
  });
  const invoices = invoicesRes?.data || [];

  const readings = (() => {
    // Sort invoices chronologically to reconstruct cumulative readings
    const sortedInvoices = [...invoices].sort((a, b) => {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    let cumulativeElectric = 100;
    let cumulativeWater = 10;

    return sortedInvoices.map((inv) => {
      const electricItem = inv.items?.find((item) =>
        item.item_name.toLowerCase().includes("dien") || item.item_name.toLowerCase().includes("electric")
      );
      const waterItem = inv.items?.find((item) =>
        item.item_name.toLowerCase().includes("nuoc") || item.item_name.toLowerCase().includes("water")
      );

      const electricConsumption = electricItem ? Number(electricItem.quantity) : 0;
      const waterConsumption = waterItem ? Number(waterItem.quantity) : 0;

      const electricOld = cumulativeElectric;
      cumulativeElectric += electricConsumption;
      const electricNew = cumulativeElectric;

      const waterOld = cumulativeWater;
      cumulativeWater += waterConsumption;
      const waterNew = cumulativeWater;

      const dateObj = new Date(inv.created_at);
      let month = dateObj.getMonth() + 1;
      let year = dateObj.getFullYear();
      if (inv.invoice_code) {
        const codeParts = inv.invoice_code.split("-");
        if (codeParts.length === 3) {
          const ym = codeParts[2];
          if (ym.length === 6) {
            year = Number(ym.substring(0, 4));
            month = Number(ym.substring(4, 6));
          }
        }
      }

      return {
        id: inv.id,
        apartment_id: activeContract?.apartment_id || 0,
        month,
        year,
        electric_old: electricOld,
        electric_new: electricNew,
        water_old: waterOld,
        water_new: waterNew,
        created_at: inv.created_at,
        recorded_by: 1,
        staff: {
          full_name: "Ban quản lý"
        }
      };
    });
  })();

  const isLoading = loadingContracts || (!!activeContract && loadingApartments) || (!!activeContract && loadingInvoices);

  return {
    apartment,
    readings,
    activeContract,
    isLoading,
  };
}
