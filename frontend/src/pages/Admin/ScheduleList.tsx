import Card from "../../components/common/ui/Card";
import Badge from "../../components/common/ui/Badge";
import DataTable, { type Column } from "../../components/common/ui/DataTable";
import { mockViewingSchedules } from "../../data/schedules";
import { mockApartments } from "../../data/apartments";
import { SCHEDULE_STATUS_LABELS } from "../../constants/enums";
import { formatDateTime } from "../../utils/format";
import type { ViewingSchedule } from "../../types";
import type { ScheduleStatus } from "../../constants/enums";
import Button from "../../components/common/ui/Button";
import { toast } from "sonner";

// Trang lich xem phong
export default function ScheduleList() {
  const statusColors: Record<string, string> = {
    PENDING: "warning",
    CONFIRMED: "info",
    DONE: "success",
    CANCELLED: "gray",
  };

  const columns: Column<ViewingSchedule>[] = [
    { key: "guest", label: "Khach hang", render: (s) => <span className="font-medium">{s.guest_name}</span> },
    { key: "phone", label: "So dien thoai", render: (s) => s.guest_phone },
    { key: "email", label: "Email", render: (s) => s.guest_email || "-" },
    {
      key: "apartment", label: "Can ho",
      render: (s) => mockApartments.find((a) => a.id === s.apartment_id)?.apartment_code || "-",
    },
    { key: "time", label: "Thoi gian xem", render: (s) => formatDateTime(s.schedule_time) },
    {
      key: "status", label: "Trang thai",
      render: (s) => (
        <Badge variant={statusColors[s.status] as "warning" | "info" | "success" | "gray"}>
          {SCHEDULE_STATUS_LABELS[s.status as ScheduleStatus]}
        </Badge>
      ),
    },
    {
      key: "actions", label: "",
      render: (s) => s.status === "PENDING" ? (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => toast.success("Da xac nhan lich")}>Xac nhan</Button>
          <Button size="sm" variant="outline" onClick={() => toast.info("Da huy lich")}>Huy</Button>
        </div>
      ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Lich xem phong</h1>
        <p className="text-sm text-gray-500">Quan ly lich hen xem phong cua khach</p>
      </div>

      <Card padding={false}>
        <DataTable columns={columns} data={mockViewingSchedules} />
      </Card>
    </div>
  );
}
