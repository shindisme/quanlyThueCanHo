import { cn } from "../../lib/utils"

interface LoadingSpinnerProps {
  size?: number
  className?: string
}

export default function LoadingSpinner({ size = 24, className }: LoadingSpinnerProps) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <svg
        className="animate-spin text-primary-600"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
    </div>
  )
}
