import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";



interface PageHeaderProps {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  count?: number;
  actions?: ReactNode;
  iconColor?: string; // gradient CSS string
}

export default function PageHeader({
  icon: Icon,
  title,
  subtitle,
  count,
  actions,
  iconColor = "linear-gradient(135deg, #7C3AED, #A78BFA)",
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 md:mb-10">
      <div className="flex items-center gap-4">
        {/* Icon */}
        {Icon && (
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
            style={{ background: iconColor }}
          >
            <Icon size={24} className="text-white" />
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            {title}
            {count !== undefined && (
              <span className="text-sm font-normal text-gray-400">({count})</span>
            )}
          </h1>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
