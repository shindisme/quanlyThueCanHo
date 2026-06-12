import Card from "../../components/common/ui/Card";
import DataTable, { type Column } from "../../components/common/ui/DataTable";
import { mockUtilityReadings } from "../../data/utilities";
import { mockApartments } from "../../data/apartments";
import type { UtilityReading } from "../../types";
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
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dien nuoc</h1>
        <p className="text-sm text-gray-500">Quan ly chi so dien nuoc theo thang</p>
      </div>

      {/* Bieu do tieu thu */}
      <Card>
        <h3 className="font-semibold text-gray-800 mb-4">Bieu do tieu thu</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
            <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
            <Tooltip />
            <Bar dataKey="electric" fill="#F59E0B" name="Dien (kWh)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="water" fill="#3B82F6" name="Nuoc (m3)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Bang chi so */}
      <Card padding={false}>
        <DataTable columns={columns} data={mockUtilityReadings} />
      </Card>
    </div>
  );
}
