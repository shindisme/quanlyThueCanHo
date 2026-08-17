import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import ChartCard from "../../../Admin/dashboard/components/ChartCard";

export interface ApartmentStatusItem {
  name: string;
  value: number;
  color: string;
}

export default function ApartmentStatusChart({ data }: { data: ApartmentStatusItem[] }) {
  return (
    <ChartCard title="Tình trạng căn hộ" subtitle="Cơ cấu căn hộ hiện tại">
      <div className="flex h-full flex-col items-center justify-between">
        <ResponsiveContainer width="100%" height={280} debounce={150}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4}>
              {data.map((item) => <Cell key={item.name} fill={item.color} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-2 w-full space-y-2">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-gray-600">{item.name}</span>
              </div>
              <span className="text-xs font-semibold text-gray-800">{item.value} căn</span>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}
