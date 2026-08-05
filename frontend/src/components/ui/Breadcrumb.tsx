import React from "react"
import type { ReactNode, ComponentPropsWithoutRef } from "react"
import { ChevronRight } from "lucide-react"
import { cn } from "../../lib/utils"

export interface BreadcrumbProps extends ComponentPropsWithoutRef<"nav"> {
  separator?: ReactNode
}

export const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  (props, ref) => {
    return <nav ref={ref} aria-label="breadcrumb" {...props} />
  }
)

Breadcrumb.displayName = "Breadcrumb"

export const BreadcrumbList = React.forwardRef<HTMLOListElement, ComponentPropsWithoutRef<"ol">>(
  ({ className, ...props }, ref) => {
    return (
      <ol
        ref={ref}
        className={cn(
          "flex flex-wrap items-center gap-1.5 wrap-break-word text-sm text-gray-500 sm:gap-2.5",
          className
        )}
        {...props}
      />
    )
  }
)
BreadcrumbList.displayName = "BreadcrumbList"

export const BreadcrumbItem = React.forwardRef<HTMLLIElement, ComponentPropsWithoutRef<"li">>(
  ({ className, ...props }, ref) => {
    return (
      <li
        ref={ref}
        className={cn("inline-flex items-center gap-1.5", className)}
        {...props}
      />
    )
  }
)
BreadcrumbItem.displayName = "BreadcrumbItem"

export const BreadcrumbLink = React.forwardRef<HTMLAnchorElement, ComponentPropsWithoutRef<"a">>(
  ({ className, ...props }, ref) => {
    return (
      <a
        ref={ref}
        className={cn("transition-colors hover:text-gray-900 cursor-pointer", className)}
        {...props}
      />
    )
  }
)
BreadcrumbLink.displayName = "BreadcrumbLink"

export const BreadcrumbPage = React.forwardRef<HTMLSpanElement, ComponentPropsWithoutRef<"span">>(
  ({ className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        role="link"
        aria-disabled="true"
        aria-current="page"
        className={cn("font-normal text-gray-800", className)}
        {...props}
      />
    )
  }
)
BreadcrumbPage.displayName = "BreadcrumbPage"

export const BreadcrumbSeparator = React.forwardRef<HTMLLIElement, ComponentPropsWithoutRef<"li">>(
  ({ children, className, ...props }, ref) => {
    return (
      <li
        ref={ref}
        role="presentation"
        aria-hidden="true"
        className={cn("[&>svg]:w-3.5 [&>svg]:h-3.5 text-gray-400", className)}
        {...props}
      >
        {children ?? <ChevronRight size={14} />}
      </li>
    )
  }
)
BreadcrumbSeparator.displayName = "BreadcrumbSeparator"



