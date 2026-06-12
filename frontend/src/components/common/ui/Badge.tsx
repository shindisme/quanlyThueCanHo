import { cn } from "../../../lib/utils";

// Badge hien thi trang thai voi mau sac tuong ung
type BadgeVariant = "success" | "warning" | "danger" | "info" | "gray";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-success-50 text-success-600",
  warning: "bg-warning-50 text-warning-600",
  danger: "bg-danger-50 text-danger-600",
  info: "bg-info-50 text-info-600",
  gray: "bg-gray-100 text-gray-600",
};

export default function Badge({ variant = "gray", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
