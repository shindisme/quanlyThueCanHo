import type { ComponentProps } from "react"
import { cn } from "../../lib/utils"

function Table({ className, ref, ...props }: ComponentProps<"table">) {
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

function TableHeader({ className, ref, ...props }: ComponentProps<"thead">) {
  return (
    <thead
      ref={ref}
      className={cn("bg-gray-50 border-b border-gray-100 [&_tr]:border-b", className)}
      {...props}
    />
  )
}

function TableBody({ className, ref, ...props }: ComponentProps<"tbody">) {
  return (
    <tbody
      ref={ref}
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ref, ...props }: ComponentProps<"tfoot">) {
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

function TableRow({ className, ref, ...props }: ComponentProps<"tr">) {
  return (
    <tr
      ref={ref}
      className={cn(
        "border-b border-gray-100 transition-colors hover:bg-gray-50/80 data-[state=selected]:bg-gray-100",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ref, ...props }: ComponentProps<"th">) {
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

function TableCell({ className, ref, ...props }: ComponentProps<"td">) {
  return (
    <td
      ref={ref}
      className={cn("p-3 align-middle text-gray-750 has-[[role=checkbox]]:pr-0", className)}
      {...props}
    />
  )
}

function TableCaption({ className, ref, ...props }: ComponentProps<"caption">) {
  return (
    <caption
      ref={ref}
      className={cn("mt-4 text-sm text-gray-500", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
}
