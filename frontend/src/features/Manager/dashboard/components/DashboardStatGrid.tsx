import { CalendarDays, Home, Users, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import StatCard from "../../../Admin/dashboard/components/StatCard";

interface DashboardStatGridProps {
  totalApartments: number;
  pendingMaintenance: number;
  activeTenants: number;
  availableApartments: number;
  pendingSchedules: number;
  finalCard: {
    icon: LucideIcon;
    label: string;
    value: string | number;
    iconColor: string;
    iconBg: string;
    variant?: "green";
  };
}

export default function DashboardStatGrid({
  totalApartments,
  pendingMaintenance,
  activeTenants,
  availableApartments,
  pendingSchedules,
  finalCard,
}: DashboardStatGridProps) {
  const cards = [
    { icon: Home, label: "Tổng căn hộ", value: totalApartments, iconColor: "text-primary-600", iconBg: "bg-primary-50" },
    { icon: Wrench, label: "Yêu cầu sửa chữa", value: pendingMaintenance, iconColor: "text-warning-600", iconBg: "bg-warning-50" },
    { icon: Users, label: "Người thuê", value: activeTenants, iconColor: "text-info-600", iconBg: "bg-info-50" },
    { icon: Home, label: "Còn trống", value: availableApartments, iconColor: "text-emerald-600", iconBg: "bg-emerald-50" },
    { icon: CalendarDays, label: "Lịch hẹn chờ duyệt", value: pendingSchedules, iconColor: "text-danger-600", iconBg: "bg-danger-50" },
    finalCard,
  ];

  return (
    <div className="grid grid-cols-12 items-stretch gap-6">
      {cards.map((card) => (
        <div key={card.label} className="col-span-12 sm:col-span-6 lg:col-span-4">
          <StatCard {...card} />
        </div>
      ))}
    </div>
  );
}
