import React from "react"
import type { ComponentPropsWithoutRef } from "react"
import { cn } from "../../lib/utils"

export const Table = React.forwardRef<HTMLTableElement, ComponentPropsWithoutRef<"table">>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative w-full overflow-auto">
        <table
          ref={ref}
          className={cn("w-full caption-bottom text-sm border-collapse", className)}
          {...props}
        />
      </div>
    )
  }
)
Table.displayName = "Table"

export const TableHeader = React.forwardRef<HTMLTableSectionElement, ComponentPropsWithoutRef<"thead">>(
  ({ className, ...props }, ref) => {
    return (
      <thead
        ref={ref}
        className={cn("bg-gray-200 border-b border-gray-300 [&_tr]:border-b", className)}
        {...props}
      />
    )
  }
)
TableHeader.displayName = "TableHeader"

export const TableBody = React.forwardRef<HTMLTableSectionElement, ComponentPropsWithoutRef<"tbody">>(
  ({ className, ...props }, ref) => {
    return (
      <tbody
        ref={ref}
        className={cn("[&_tr:last-child]:border-0", className)}
        {...props}
      />
    )
  }
)
TableBody.displayName = "TableBody"

export const TableFooter = React.forwardRef<HTMLTableSectionElement, ComponentPropsWithoutRef<"tfoot">>(
  ({ className, ...props }, ref) => {
    return (
      <tfoot
        ref={ref}
        className={cn(
          "border-t bg-gray-50 font-medium [&>tr]:last:border-b-0",
          className
        )}
        {...props}
      />
    )
  }
)
TableFooter.displayName = "TableFooter"

export const TableRow = React.forwardRef<HTMLTableRowElement, ComponentPropsWithoutRef<"tr">>(
  ({ className, ...props }, ref) => {
    return (
      <tr
        ref={ref}
        className={cn(
          "border-b border-gray-100 transition-colors hover:[&>td]:bg-gray-50/80 data-[state=selected]:[&>td]:bg-gray-100 odd:[&>td]:bg-white even:[&>td]:bg-gray-200/50",
          className
        )}
        {...props}
      />
    )
  }
)
TableRow.displayName = "TableRow"

export const TableHead = React.forwardRef<HTMLTableCellElement, ComponentPropsWithoutRef<"th">>(
  ({ className, ...props }, ref) => {
    return (
      <th
        ref={ref}
        className={cn(
          "h-10 px-4 text-left align-middle font-semibold text-gray-500 text-xs uppercase tracking-wider has-[[role=checkbox]]:pr-0",
          className
        )}
        {...props}
      />
    )
  }
)
TableHead.displayName = "TableHead"

export const TableCell = React.forwardRef<HTMLTableCellElement, ComponentPropsWithoutRef<"td">>(
  ({ className, ...props }, ref) => {
    return (
      <td
        ref={ref}
        className={cn("p-3 align-middle text-gray-750 has-[[role=checkbox]]:pr-0", className)}
        {...props}
      />
    )
  }
)
TableCell.displayName = "TableCell"

export const TableCaption = React.forwardRef<HTMLTableCaptionElement, ComponentPropsWithoutRef<"caption">>(
  ({ className, ...props }, ref) => {
    return (
      <caption
        ref={ref}
        className={cn("mt-4 text-sm text-gray-500", className)}
        {...props}
      />
    )
  }
)
TableCaption.displayName = "TableCaption"



