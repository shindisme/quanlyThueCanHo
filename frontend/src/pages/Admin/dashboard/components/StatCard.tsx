import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string | number;
  trend?: "up" | "down";
  trendValue?: string;
  iconColor: string;
  iconBg: string;
  variant?: "default" | "green";
}

export default function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  trendValue,
  iconColor,
  iconBg,
  variant = "default",
}: StatCardProps) {
  const isGreen = variant === "green";
  return (
    <div
      className={`border transition-all duration-200 p-5 shadow-md hover:shadow-lg rounded-none h-full flex flex-col justify-between ${
        isGreen ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white border-gray-200"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isGreen ? "text-emerald-100" : "text-gray-500"}`}>
            {label}
          </p>
          <p className={`text-2xl font-bold mb-1 ${isGreen ? "text-white" : "text-gray-900"}`}>{value}</p>
          {trend && trendValue && (
            <div
              className={`flex items-center gap-1 mt-1 text-xs font-medium ${
                isGreen ? "text-emerald-200" : trend === "up" ? "text-success-600" : "text-danger-600"
              }`}
            >
              {trend === "up" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-none flex items-center justify-center shrink-0 ${isGreen ? "bg-white/20" : iconBg}`}>
          <Icon size={22} className={isGreen ? "text-white" : iconColor} />
        </div>
      </div>
    </div>
  );
}
