import type { ComponentProps } from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "../../lib/utils"
import Button from "./Button"

export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

function Pagination({ className, ref, ...props }: ComponentProps<"nav">) {
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

function PaginationContent({ className, ref, ...props }: ComponentProps<"ul">) {
  return (
    <ul
      ref={ref}
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  )
}

function PaginationItem({ className, ref, ...props }: ComponentProps<"li">) {
  return <li ref={ref} className={cn("", className)} {...props} />
}

type PaginationLinkProps = {
  isActive?: boolean
  disabled?: boolean
} & ComponentProps<typeof Button>

function PaginationLink({
  className,
  isActive,
  disabled,
  size = "icon",
  ref,
  ...props
}: PaginationLinkProps) {
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
      {...props}
    />
  )
}

function PaginationPrevious({
  className,
  ref,
  ...props
}: ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      ref={ref}
      aria-label="Go to previous page"
      size="default"
      className={cn("gap-1 pl-2.5 h-9 w-auto px-3", className)}
      {...props}
    >
      <ChevronLeft className="h-4 w-4" />
      <span>Trước</span>
    </PaginationLink>
  )
}

function PaginationNext({
  className,
  ref,
  ...props
}: ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      ref={ref}
      aria-label="Go to next page"
      size="default"
      className={cn("gap-1 pr-2.5 h-9 w-auto px-3", className)}
      {...props}
    >
      <span>Sau</span>
      <ChevronRight className="h-4 w-4" />
    </PaginationLink>
  )
}

function PaginationEllipsis({
  className,
  ref,
  ...props
}: ComponentProps<"span">) {
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

function DefaultPagination({
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

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
}

export default DefaultPagination
