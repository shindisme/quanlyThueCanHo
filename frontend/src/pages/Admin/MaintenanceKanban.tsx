import { useState } from "react";
import Card from "../../components/common/ui/Card";
import Badge from "../../components/common/ui/Badge";
import { mockMaintenanceRequests } from "../../data/maintenance";
import { mockTenants } from "../../data/tenants";
import { mockApartments } from "../../data/apartments";
import { REQUEST_STATUS_LABELS, PRIORITY_LABELS, PRIORITY_COLORS } from "../../constants/enums";
import { formatRelativeTime } from "../../utils/format";
import type { MaintenanceRequest } from "../../types";
import type { RequestStatus, Priority } from "../../constants/enums";

// Trang yeu cau sua chua dang Kanban Board
// 3 cot: Moi tao (PENDING), Dang xu ly (PROCESSING), Hoan thanh (DONE)
export default function MaintenanceKanban() {
  const kanbanColumns: { status: RequestStatus; title: string; color: string }[] = [
    { status: "PENDING", title: "Moi tao", color: "bg-warning-500" },
    { status: "PROCESSING", title: "Dang xu ly", color: "bg-info-500" },
    { status: "DONE", title: "Hoan thanh", color: "bg-success-500" },
  ];

  function getRequests(status: RequestStatus): MaintenanceRequest[] {
    return mockMaintenanceRequests.filter((r) => r.status === status);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Yeu cau sua chua</h1>
        <p className="text-sm text-gray-500">Theo doi va xu ly cac yeu cau bao tri</p>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kanbanColumns.map((col) => {
          const requests = getRequests(col.status);
          return (
            <div key={col.status} className="bg-gray-50 rounded-2xl p-4">
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
                        <span>{tenant?.full_name} - {apt?.apartment_code}</span>
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
