import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import * as buildingService from "../services/buildingService";
import * as apartmentService from "../services/apartmentService";
import * as contractService from "../services/contractService";
import * as invoiceService from "../services/invoiceService";
import * as tenantService from "../services/tenantService";
import * as staffService from "../services/staffService";
import * as authService from "../services/authService";
import * as maintenanceService from "../services/maintenanceService";
import * as notificationService from "../services/notificationService";
import * as paymentService from "../services/paymentService";
import * as scheduleService from "../services/scheduleService";
import * as utilityService from "../services/utilityService";

export function useSystemPrefetch(role: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!role) return;

    const prefetchData = async () => {
      try {
        await queryClient.prefetchQuery({
          queryKey: ["buildings"],
          queryFn: () => buildingService.getAllBuildingsPage(),
        });

        await queryClient.prefetchQuery({
          queryKey: ["apartments"],
          queryFn: () => apartmentService.getAllApartmentsPage(),
        });
        await queryClient.prefetchQuery({
          queryKey: ["contracts"],
          queryFn: () => contractService.getAllContractsPage(),
        });

        await queryClient.prefetchQuery({
          queryKey: ["invoices"],
          queryFn: () => invoiceService.getAllInvoicesPage(),
        });

        await queryClient.prefetchQuery({
          queryKey: ["schedules"],
          queryFn: () => scheduleService.getAllSchedulesPage(),
        });

        await queryClient.prefetchQuery({
          queryKey: ["notifications", "", ""],
          queryFn: () => notificationService.getAllNotificationsPage(),
        });

        if (role === "ADMIN" || role === "MANAGER" || role === "STAFF") {
          await queryClient.prefetchQuery({
            queryKey: ["tenants"],
            queryFn: () => tenantService.getAllTenantsPage(),
          });

          await queryClient.prefetchQuery({
            queryKey: ["staff"],
            queryFn: () => staffService.getAllStaffsPage(),
          });

          await queryClient.prefetchQuery({
            queryKey: ["users"],
            queryFn: () => authService.getAllUsersPage(),
          });

          await queryClient.prefetchQuery({
            queryKey: ["payments", "", "", "", ""],
            queryFn: () => paymentService.getAllPaymentsPage(),
          });

          const curM = String(new Date().getMonth() + 1);
          const curY = String(new Date().getFullYear());
          await queryClient.prefetchQuery({
            queryKey: ["utilityReadings", role, undefined, "", curM, curY],
            queryFn: () => utilityService.getAllUtilityReadingsPage({ month: Number(curM), year: Number(curY) }),
          });

          await queryClient.prefetchQuery({
            queryKey: ["adminMaintenanceRequests", "", "", "", role, undefined],
            queryFn: () => maintenanceService.getAllMaintenanceRequests(),
          });
        }
      } catch (error) {
        console.error("Global system prefetch error:", error);
      }
    };

    const timer = setTimeout(() => {
      prefetchData();
    }, 1200);

    return () => clearTimeout(timer);
  }, [role, queryClient]);
}
