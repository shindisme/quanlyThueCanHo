import React from "react"
import type { ComponentPropsWithoutRef } from "react"
import { cn } from "../../lib/utils"

export const Skeleton = React.forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("animate-pulse rounded-md bg-gray-200/80", className)}
        {...props}
      />
    )
  }
)
Skeleton.displayName = "Skeleton"



