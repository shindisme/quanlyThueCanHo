import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import DataTable, { type Column } from "../../components/ui/DataTable";
import { mockUtilityReadings } from "../../data/utilities";
import { mockApartments } from "../../data/apartments";
import type { UtilityReading } from "../../types";
import { Zap } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

// Trang quan ly dien nuoc
export default function UtilityList() {
  // Chuan bi du lieu bieu do tieu thu
  const chartData = mockUtilityReadings.map((r) => ({
    name: `T${r.month}/${r.year}`,
    electric: r.electric_new - r.electric_old,
    water: r.water_new - r.water_old,
    apartment: mockApartments.find((a) => a.id === r.apartment_id)?.apartment_code || "",
  }));

  const columns: Column<UtilityReading>[] = [
    {
      key: "apartment", label: "Can ho",
      render: (r) => <span className="font-medium">{mockApartments.find((a) => a.id === r.apartment_id)?.apartment_code || "-"}</span>,
    },
    { key: "period", label: "Ky", render: (r) => `Thang ${r.month}/${r.year}` },
    { key: "electric_old", label: "Dien cu", render: (r) => `${r.electric_old} kWh` },
    { key: "electric_new", label: "Dien moi", render: (r) => `${r.electric_new} kWh` },
    {
      key: "electric_used", label: "Tieu thu dien",
      render: (r) => <span className="font-semibold text-warning-600">{r.electric_new - r.electric_old} kWh</span>,
    },
    { key: "water_old", label: "Nuoc cu", render: (r) => `${r.water_old} m3` },
    { key: "water_new", label: "Nuoc moi", render: (r) => `${r.water_new} m3` },
    {
      key: "water_used", label: "Tieu thu nuoc",
      render: (r) => <span className="font-semibold text-info-600">{r.water_new - r.water_old} m3</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Zap}
        title="Điện nước"
        subtitle="Quản lý và theo dõi chỉ số tiêu thụ điện nước"
        count={mockUtilityReadings.length}
        iconColor="linear-gradient(135deg, #F59E0B, #FBBF24)"
      />

      {/* Bieu do tieu thu */}
      <Card>
        <h3 className="font-semibold text-gray-800 mb-4">Biểu đồ tiêu thụ</h3>
        <ResponsiveContainer width="100%" height={250} debounce={150}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
            <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
            <Tooltip />
            <Bar dataKey="electric" fill="#F59E0B" name="Điện (kWh)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="water" fill="#3B82F6" name="Nước (m3)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Bang chi so */}
      <DataTable columns={columns} data={mockUtilityReadings} />
    </div>
  );
}
