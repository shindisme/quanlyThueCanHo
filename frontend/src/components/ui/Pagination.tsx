import React from "react"
import type { ComponentPropsWithoutRef } from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "../../lib/utils"
import Button, { type ButtonProps } from "./Button"

export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export const Pagination = React.forwardRef<HTMLElement, ComponentPropsWithoutRef<"nav">>(
  ({ className, ...props }, ref) => {
    return (
      <nav
        ref={ref}
        role="navigation"
        aria-label="pagination"
        className={cn("mx-auto flex w-full justify-center", className)}
        {...props}
      />
    )
  }
)
Pagination.displayName = "Pagination"

export const PaginationContent = React.forwardRef<HTMLUListElement, ComponentPropsWithoutRef<"ul">>(
  ({ className, ...props }, ref) => {
    return (
      <ul
        ref={ref}
        className={cn("flex flex-row items-center gap-1", className)}
        {...props}
      />
    )
  }
)
PaginationContent.displayName = "PaginationContent"

export const PaginationItem = React.forwardRef<HTMLLIElement, ComponentPropsWithoutRef<"li">>(
  ({ className, ...props }, ref) => {
    return <li ref={ref} className={cn("", className)} {...props} />
  }
)
PaginationItem.displayName = "PaginationItem"

export type PaginationLinkProps = {
  isActive?: boolean
  disabled?: boolean
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
} & ButtonProps

export const PaginationLink = React.forwardRef<HTMLButtonElement, PaginationLinkProps>(
  (
    {
      className,
      isActive,
      disabled,
      onClick,
      size = "icon",
      ...props
    },
    ref
  ) => {
    return (
      <Button
        ref={ref}
        aria-current={isActive ? "page" : undefined}
        variant={isActive ? "default" : "outline"}
        size={size}
        className={cn(
          "w-9 h-9",
          isActive ? "" : "text-gray-600 hover:bg-gray-100",
          className
        )}
        disabled={disabled}
        onClick={onClick}
        {...props}
      />
    )
  }
)
PaginationLink.displayName = "PaginationLink"

export const PaginationPrevious = React.forwardRef<HTMLButtonElement, PaginationLinkProps>(
  ({ className, onClick, disabled, ...props }, ref) => {
    return (
      <PaginationLink
        ref={ref}
        aria-label="Go to previous page"
        size="default"
        className={cn("gap-1 pl-2.5 h-9 w-auto px-3", className)}
        onClick={onClick}
        disabled={disabled}
        {...props}
      >
        <ChevronLeft className="h-4 w-4" />
        <span>Trước</span>
      </PaginationLink>
    )
  }
)
PaginationPrevious.displayName = "PaginationPrevious"

export const PaginationNext = React.forwardRef<HTMLButtonElement, PaginationLinkProps>(
  ({ className, onClick, disabled, ...props }, ref) => {
    return (
      <PaginationLink
        ref={ref}
        aria-label="Go to next page"
        size="default"
        className={cn("gap-1 pr-2.5 h-9 w-auto px-3", className)}
        onClick={onClick}
        disabled={disabled}
        {...props}
      >
        <span>Sau</span>
        <ChevronRight className="h-4 w-4" />
      </PaginationLink>
    )
  }
)
PaginationNext.displayName = "PaginationNext"

export const PaginationEllipsis = React.forwardRef<HTMLSpanElement, ComponentPropsWithoutRef<"span">>(
  ({ className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        aria-hidden
        className={cn("flex h-9 w-9 items-center justify-center text-gray-400", className)}
        {...props}
      >
        <MoreHorizontal className="h-4 w-4" />
        <span className="sr-only">More pages</span>
      </span>
    )
  }
)
PaginationEllipsis.displayName = "PaginationEllipsis"

export function DefaultPagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null

  const getPageNumbers = (): (number | "...")[] => {
    const pages: (number | "...")[] = []
    const maxVisible = 5
    const curr = Number(currentPage)
    const total = Number(totalPages)

    if (total <= maxVisible) {
      for (let i = 1; i <= total; i++) pages.push(i)
    } else {
      pages.push(1)
      const start = Math.max(2, curr - 1)
      const end = Math.min(total - 1, curr + 1)

      if (start > 2) pages.push("...")
      for (let i = start; i <= end; i++) pages.push(i)
      if (end < total - 1) pages.push("...")
      pages.push(total)
    }

    return pages
  }

  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => onPageChange(Number(currentPage) - 1)}
            disabled={Number(currentPage) === 1}
          />
        </PaginationItem>

        {getPageNumbers().map((page, index) => (
          <PaginationItem key={page === "..." ? `dots-${index}` : page}>
            {page === "..." ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                isActive={Number(page) === Number(currentPage)}
                onClick={() => onPageChange(Number(page))}
              >
                {page}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext
            onClick={() => onPageChange(Number(currentPage) + 1)}
            disabled={Number(currentPage) === Number(totalPages)}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

export default DefaultPagination


