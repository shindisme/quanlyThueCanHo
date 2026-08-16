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
import { queryKeys } from "../constants/queryKeys";

export function useSystemPrefetch(role: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!role || role === "STAFF" || role === "TENANT") return;

    const prefetchData = async () => {
      try {
        await queryClient.prefetchQuery({
          queryKey: queryKeys.buildings.all,
          queryFn: () => buildingService.getAllPage(),
        });

        await queryClient.prefetchQuery({
          queryKey: queryKeys.apartments.all,
          queryFn: () => apartmentService.getAllPage(),
        });
        await queryClient.prefetchQuery({
          queryKey: queryKeys.contracts.all,
          queryFn: () => contractService.getAllPage(),
        });

        await queryClient.prefetchQuery({
          queryKey: queryKeys.invoices.all,
          queryFn: () => invoiceService.getAllPage(),
        });

        await queryClient.prefetchQuery({
          queryKey: queryKeys.schedules.all,
          queryFn: () => scheduleService.getAllPage(),
        });

        await queryClient.prefetchQuery({
          queryKey: queryKeys.notifications.list(),
          queryFn: () => notificationService.getAllPage(),
        });

        if (role === "ADMIN" || role === "MANAGER" || role === "STAFF") {
          await queryClient.prefetchQuery({
            queryKey: queryKeys.tenants.all,
            queryFn: () => tenantService.getAllPage(),
          });

          await queryClient.prefetchQuery({
            queryKey: queryKeys.staff.all,
            queryFn: () => staffService.getAllPage(),
          });

          await queryClient.prefetchQuery({
            queryKey: queryKeys.users.all,
            queryFn: () => authService.getAllPage(),
          });

          await queryClient.prefetchQuery({
            queryKey: queryKeys.payments.list(),
            queryFn: () => paymentService.getAllPage(),
          });

          const curM = String(new Date().getMonth() + 1);
          const curY = String(new Date().getFullYear());
          await queryClient.prefetchQuery({
            queryKey: queryKeys.utilities.list({ role, month: Number(curM), year: Number(curY) }),
            queryFn: () => utilityService.getAllPage({ month: Number(curM), year: Number(curY) }),
          });

          await queryClient.prefetchQuery({
            queryKey: queryKeys.maintenance.list({ role }),
            queryFn: () => maintenanceService.getAll(),
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
