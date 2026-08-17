import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import ChartCard from "../../../Admin/dashboard/components/ChartCard";
import { formatDashboardCurrency, type MonthlyRevenueItem, type YearlyRevenueItem } from "../utils/dashboardHelpers";

interface RevenueAreaChartProps {
  data: (MonthlyRevenueItem | YearlyRevenueItem)[];
  timeFrame: "month" | "year";
  setTimeFrame: (tf: "month" | "year") => void;
  currentYear: number;
  gradientId?: string;
  color?: string;
}

export default function RevenueAreaChart({
  data,
  timeFrame,
  setTimeFrame,
  currentYear,
  gradientId = "gradientRevenueManager",
  color = "#10B981",
}: RevenueAreaChartProps) {
  return (
    <ChartCard
      title={`Doanh thu (${timeFrame === "month" ? `Năm ${currentYear}` : "Theo năm"})`}
      action={
        <div className="flex bg-gray-100 rounded-lg p-0.5 border border-gray-200">
          <button
            onClick={() => setTimeFrame("month")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              timeFrame === "month"
                ? "bg-white text-emerald-600 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Theo tháng
          </button>
          <button
            onClick={() => setTimeFrame("year")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              timeFrame === "year"
                ? "bg-white text-emerald-600 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Theo năm
          </button>
        </div>
      }
    >
      <ResponsiveContainer width="100%" height={250} debounce={150}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
          <YAxis
            tick={{ fontSize: 11 }}
            stroke="#9CA3AF"
            tickFormatter={(v) => `${(v / 1000000).toFixed(0)}tr`}
          />
          <Tooltip
            formatter={(value) => [formatDashboardCurrency(Number(value) || 0), "Doanh thu"]}
            contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "13px" }}
          />
          {timeFrame === "month" && (
            <Area
              type="monotone"
              dataKey="Năm trước"
              stroke="#D1D5DB"
              strokeWidth={1.5}
              fill="transparent"
              name="Năm trước"
            />
          )}
          <Area
            type="monotone"
            dataKey="Doanh thu"
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            name="Doanh thu"
            dot={{ fill: color, r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
