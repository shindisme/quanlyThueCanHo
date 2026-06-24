import { forwardRef } from "react"
import type { ReactNode, ComponentProps } from "react"
import { cn } from "../../lib/utils"

const CardContainer = forwardRef<
  HTMLDivElement,
  ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "border border-gray-200/80 bg-white rounded-xl shadow-sm hover:shadow transition-all duration-200",
      className
    )}
    {...props}
  />
))
CardContainer.displayName = "Card"

const CardHeader = forwardRef<
  HTMLDivElement,
  ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-5 border-b border-gray-100", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = forwardRef<
  HTMLParagraphElement,
  ComponentProps<"h3">
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold text-gray-800 leading-none tracking-tight", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = forwardRef<
  HTMLParagraphElement,
  ComponentProps<"p">
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs text-gray-400 mt-0.5", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = forwardRef<
  HTMLDivElement,
  ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-5 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = forwardRef<
  HTMLDivElement,
  ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-5 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

interface OldCardProps {
  children: ReactNode
  className?: string
  padding?: boolean
  title?: string
  subtitle?: string
  action?: ReactNode
}

export default function Card({
  children,
  className,
  padding = true,
  title,
  subtitle,
  action,
}: OldCardProps) {
  return (
    <CardContainer className={className}>
      {title && (
        <div className={cn("flex items-center justify-between", padding ? "mb-4" : "px-5 py-4 border-b border-gray-100")}>
          <div>
            <h3 className="font-semibold text-gray-800">{title}</h3>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={cn(padding && "p-5", title && "pt-0")}>
        {children}
      </div>
    </CardContainer>
  )
}

export { CardContainer as Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }

