import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import ChartCard from "../../../Admin/dashboard/components/ChartCard";

export interface ApartmentStatusItem {
  name: string;
  value: number;
  percentage?: number;
  color: string;
}

interface ApartmentStatusChartProps {
  data: ApartmentStatusItem[];
  title?: string;
  subtitle?: string;
}

export default function ApartmentStatusChart({
  data,
  title = "Trạng thái căn hộ",
  subtitle = "Cấu trúc trạng thái phòng thực tế",
}: ApartmentStatusChartProps) {
  const total = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

  return (
    <ChartCard title={title} subtitle={subtitle}>
      <div className="flex flex-col items-center justify-between h-full font-sans">
        {total === 0 ? (
          <div className="flex h-45 w-full items-center justify-center text-xs text-gray-400 font-medium">
            Chưa có dữ liệu căn hộ
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180} debounce={150}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={4}
              >
                {data.map((item) => (
                  <Cell key={item.name} fill={item.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [`${value} căn`, name]} />
            </PieChart>
          </ResponsiveContainer>
        )}

        <div className="grid grid-cols-3 gap-2 w-full mt-2 border-t border-gray-100 pt-3">
          {data.map((item) => {
            const pct = item.percentage ?? (total > 0 ? Math.round((item.value / total) * 100) : 0);

            return (
              <div key={item.name} className="flex flex-col items-center text-center">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[10px] text-gray-500 font-medium">{item.name}</span>
                </div>
                <span className="text-xs font-bold text-gray-800 mt-0.5">{item.value} căn</span>
                <span className="text-[10px] text-gray-400 font-medium">({pct}%)</span>
              </div>
            );
          })}
        </div>
      </div>
    </ChartCard>
  );
}
