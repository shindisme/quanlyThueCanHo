import { cn } from "../../lib/utils";

// Badge hiển thị trạng thái với màu sắc tương ứng
export type BadgeVariant = "success" | "warning" | "danger" | "info" | "gray";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  showDot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-success-50/70 text-success-600 border-success-500/10",
  warning: "bg-warning-50/70 text-warning-600 border-warning-500/10",
  danger: "bg-danger-50/70 text-danger-600 border-danger-500/10",
  info: "bg-info-50/70 text-info-600 border-info-500/10",
  gray: "bg-gray-100/70 text-gray-600 border-gray-500/10",
};

const dotColors: Record<BadgeVariant, string> = {
  success: "bg-success-600",
  warning: "bg-warning-600",
  danger: "bg-danger-600",
  info: "bg-info-600",
  gray: "bg-gray-400",
};

export default function Badge({ variant = "gray", children, className, showDot = true }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all shadow-sm",
        variantStyles[variant],
        className
      )}
    >
      {showDot && (
        <span className={cn("w-1.5 h-1.5 rounded-full", dotColors[variant])} />
      )}
      {children}
    </span>
  );
}
