import { Wrench } from "lucide-react";
import PageHeader from "../../../components/ui/PageHeader";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import { mockMaintenanceRequests } from "../../../data/maintenance";
import { mockTenants } from "../../../data/tenants";
import { mockApartments } from "../../../data/apartments";
import { mockUsers } from "../../../data/users";
import { useAuthStore } from "../../../stores/auth.store";
import { PRIORITY_LABELS, PRIORITY_COLORS } from "../../../constants/enums";
import { formatRelativeTime } from "../../../utils/format";
import type { MaintenanceRequest } from "../../../types";
import type { RequestStatus, Priority } from "../../../constants/enums";


export default function MaintenanceKanban() {
  const { role, email } = useAuthStore();
  const currentUser = mockUsers.find((u) => u.email === email);
  const managerBuildingId = currentUser?.managedBuildingId;

  const kanbanColumns: { status: RequestStatus; title: string; color: string }[] = [
    { status: "PENDING", title: "Mới tạo", color: "bg-warning-500" },
    { status: "PROCESSING", title: "Đang xử lý", color: "bg-info-500" },
    { status: "DONE", title: "Hoàn thành", color: "bg-success-500" },
  ];

  const displayRequests = (() => {
    if (role === "MANAGER" && managerBuildingId) {
      const managerApartmentIds = mockApartments
        .filter((a) => a.building_id === managerBuildingId)
        .map((a) => a.id);
      return mockMaintenanceRequests.filter((r) => managerApartmentIds.includes(r.apartment_id));
    }
    return mockMaintenanceRequests;
  })();

  function getRequests(status: RequestStatus): MaintenanceRequest[] {
    return displayRequests.filter((r) => r.status === status);
  }

  return (
    <>Yêu cầu sửa chữa</>
  );
}
