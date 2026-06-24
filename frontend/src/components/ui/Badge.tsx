import type { ComponentProps } from "react"
import { cn } from "../../lib/utils"

export type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "gray"
  | "default"
  | "secondary"
  | "destructive"
  | "outline"

export interface BadgeProps extends ComponentProps<"span"> {
  variant?: BadgeVariant
  showDot?: boolean
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-primary-600 text-white border-transparent",
  secondary: "bg-gray-100 text-gray-900 border-transparent hover:bg-gray-100/80",
  destructive: "bg-danger-500 text-white border-transparent",
  outline: "text-gray-950 border-gray-200",
  success: "bg-success-50/70 text-success-600 border-success-500/10",
  warning: "bg-warning-50/70 text-warning-600 border-warning-500/10",
  danger: "bg-danger-50/70 text-danger-600 border-danger-500/10",
  info: "bg-info-50/70 text-info-600 border-info-500/10",
  gray: "bg-gray-100/70 text-gray-600 border-gray-500/10",
}

const dotColors: Record<BadgeVariant, string> = {
  default: "bg-white",
  secondary: "bg-gray-400",
  destructive: "bg-white",
  outline: "bg-gray-400",
  success: "bg-success-600",
  warning: "bg-warning-600",
  danger: "bg-danger-600",
  info: "bg-info-600",
  gray: "bg-gray-400",
}

export default function Badge({
  variant = "gray",
  className,
  showDot = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[8px] text-xs font-semibold border transition-all shadow-sm",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {showDot && (
        <span className={cn("w-1.5 h-1.5 rounded-full", dotColors[variant])} />
      )}
      {children}
    </span>
  )
}
