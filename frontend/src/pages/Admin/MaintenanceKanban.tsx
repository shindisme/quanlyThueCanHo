import { Wrench } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import { mockMaintenanceRequests } from "../../data/maintenance";
import { mockTenants } from "../../data/tenants";
import { mockApartments } from "../../data/apartments";
import { mockUsers } from "../../data/users";
import { useAuthStore } from "../../stores/auth.store";
import { PRIORITY_LABELS, PRIORITY_COLORS } from "../../constants/enums";
import { formatRelativeTime } from "../../utils/format";
import type { MaintenanceRequest } from "../../types";
import type { RequestStatus, Priority } from "../../constants/enums";


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
    <div className="space-y-6">
      <PageHeader
        icon={Wrench}
        title="Yêu cầu sửa chữa"
        subtitle="Theo dõi và xử lý các yêu cầu bảo trì dạng Kanban"
        iconColor="linear-gradient(135deg, #EF4444, #F87171)"
      />

      {/* Kanban Board - 12 cột */}
      <div className="grid grid-cols-12 gap-6">
        {kanbanColumns.map((col) => {
          const requests = getRequests(col.status);
          return (
            <div key={col.status} className="col-span-12 md:col-span-4 bg-gray-50 rounded-2xl p-4">
              {/* Tieu de cot */}
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                <h3 className="font-semibold text-gray-800">{col.title}</h3>
                <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                  {requests.length}
                </span>
              </div>

              {/* Danh sach card */}
              <div className="space-y-3">
                {requests.map((req) => {
                  const tenant = mockTenants.find((t) => t.id === req.tenant_id);
                  const apt = mockApartments.find((a) => a.id === req.apartment_id);
                  return (
                    <Card key={req.id} className="cursor-pointer hover:shadow-card-hover transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-800">{req.title}</h4>
                        <Badge variant={PRIORITY_COLORS[req.priority as Priority] as "gray" | "warning" | "danger"}>
                          {PRIORITY_LABELS[req.priority as Priority]}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-3">{req.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{tenant?.full_name} - P.{apt?.room_number} T{apt?.floor}</span>
                        <span>{formatRelativeTime(req.created_at)}</span>
                      </div>
                    </Card>
                  );
                })}

                {requests.length === 0 && (
                  <p className="text-center text-sm text-gray-400 py-8">Khong co yeu cau</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
