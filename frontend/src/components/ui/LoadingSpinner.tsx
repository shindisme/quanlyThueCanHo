import React from "react"
import { cn } from "../../lib/utils"

export type LoadingSpinnerVariant = "primary" | "secondary" | "white" | "danger" | "current"

export interface LoadingSpinnerProps extends React.ComponentPropsWithoutRef<"svg"> {
  size?: number
  variant?: LoadingSpinnerVariant
  strokeWidth?: number
  label?: string
}

const variantStyles: Record<LoadingSpinnerVariant, string> = {
  primary: "text-primary-600",
  secondary: "text-gray-500",
  white: "text-white",
  danger: "text-danger-600",
  current: "text-current",
}

export const LoadingSpinner = React.forwardRef<SVGSVGElement, LoadingSpinnerProps>(
  (
    {
      size = 24,
      variant = "primary",
      strokeWidth = 4,
      label = "Đang tải...",
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div className="inline-flex items-center justify-center" role="status" aria-live="polite">
        <svg
          ref={ref}
          className={cn("animate-spin", variantStyles[variant], className)}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          {...props}
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth={strokeWidth}
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <span className="sr-only">{label}</span>
      </div>
    )
  }
)

LoadingSpinner.displayName = "LoadingSpinner"

export default LoadingSpinner

