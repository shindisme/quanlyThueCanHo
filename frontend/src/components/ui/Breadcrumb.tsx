import type { ReactNode, ComponentProps } from "react"
import { ChevronRight } from "lucide-react"
import { cn } from "../../lib/utils"

function Breadcrumb({ separator, ref, ...props }: ComponentProps<"nav"> & { separator?: ReactNode }) {
  return <nav ref={ref} aria-label="breadcrumb" {...props} />
}

function BreadcrumbList({ className, ref, ...props }: ComponentProps<"ol">) {
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

function BreadcrumbItem({ className, ref, ...props }: ComponentProps<"li">) {
  return (
    <li
      ref={ref}
      className={cn("inline-flex items-center gap-1.5", className)}
      {...props}
    />
  )
}

function BreadcrumbLink({ className, ref, ...props }: ComponentProps<"a">) {
  return (
    <a
      ref={ref}
      className={cn("transition-colors hover:text-gray-900 cursor-pointer", className)}
      {...props}
    />
  )
}

function BreadcrumbPage({ className, ref, ...props }: ComponentProps<"span">) {
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

function BreadcrumbSeparator({ children, className, ref, ...props }: ComponentProps<"li">) {
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

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
}
