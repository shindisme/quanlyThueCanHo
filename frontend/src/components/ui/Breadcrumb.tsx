import { forwardRef } from "react"
import type { ReactNode, ComponentProps } from "react"
import { ChevronRight } from "lucide-react"
import { cn } from "../../lib/utils"

const Breadcrumb = forwardRef<
  HTMLElement,
  ComponentProps<"nav"> & {
    separator?: ReactNode
  }
>(({ ...props }, ref) => <nav ref={ref} aria-label="breadcrumb" {...props} />)
Breadcrumb.displayName = "Breadcrumb"

const BreadcrumbList = forwardRef<
  HTMLOListElement,
  ComponentProps<"ol">
>(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    className={cn(
      "flex flex-wrap items-center gap-1.5 wrap-break-word text-sm text-gray-500 sm:gap-2.5",
      className
    )}
    {...props}
  />
))
BreadcrumbList.displayName = "BreadcrumbList"

const BreadcrumbItem = forwardRef<
  HTMLLIElement,
  ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn("inline-flex items-center gap-1.5", className)}
    {...props}
  />
))
BreadcrumbItem.displayName = "BreadcrumbItem"

const BreadcrumbLink = forwardRef<
  HTMLAnchorElement,
  ComponentProps<"a">
>(({ className, ...props }, ref) => {
  return (
    <a
      ref={ref}
      className={cn("transition-colors hover:text-gray-900 cursor-pointer", className)}
      {...props}
    />
  )
})
BreadcrumbLink.displayName = "BreadcrumbLink"

const BreadcrumbPage = forwardRef<
  HTMLSpanElement,
  ComponentProps<"span">
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    role="link"
    aria-disabled="true"
    aria-current="page"
    className={cn("font-normal text-gray-800", className)}
    {...props}
  />
))
BreadcrumbPage.displayName = "BreadcrumbPage"

const BreadcrumbSeparator = ({
  children,
  className,
  ...props
}: ComponentProps<"li">) => (
  <li
    role="presentation"
    aria-hidden="true"
    className={cn("[&>svg]:w-3.5 [&>svg]:h-3.5 text-gray-400", className)}
    {...props}
  >
    {children ?? <ChevronRight size={14} />}
  </li>
)
BreadcrumbSeparator.displayName = "BreadcrumbSeparator"

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
}

