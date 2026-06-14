import { cn } from "../../lib/utils";
import type { ReactNode } from "react";

// Card bao bọc nội dung - ArchitectUI style
// Bo tròn 12px, border nhẹ, shadow cực nhẹ
interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function Card({ children, className, padding = true, title, subtitle, action }: CardProps) {
  return (
    <div
      className={cn(
        "premium-card",
        padding && "p-5",
        className
      )}
    >
      {/* Card header nếu có title */}
      {title && (
        <div className={cn("flex items-center justify-between", padding ? "mb-4" : "px-5 py-4 border-b border-gray-100")}>
          <div>
            <h3 className="font-semibold text-gray-800">{title}</h3>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
