import React from "react"
import type { ReactNode, ComponentPropsWithoutRef } from "react"
import { cn } from "../../lib/utils"

export const Card = React.forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "border border-gray-200/80 bg-white shadow-lg hover:shadow transition-all duration-200",
          className
        )}
        {...props}
      />
    )
  }
)
Card.displayName = "Card"

export const CardHeader = React.forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 p-5 border-b border-gray-100", className)}
        {...props}
      />
    )
  }
)
CardHeader.displayName = "CardHeader"

export const CardTitle = React.forwardRef<HTMLHeadingElement, ComponentPropsWithoutRef<"h3">>(
  ({ className, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn("font-semibold text-gray-800 leading-none tracking-tight", className)}
        {...props}
      />
    )
  }
)
CardTitle.displayName = "CardTitle"

export const CardDescription = React.forwardRef<HTMLParagraphElement, ComponentPropsWithoutRef<"p">>(
  ({ className, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn("text-xs text-gray-400 mt-0.5", className)}
        {...props}
      />
    )
  }
)
CardDescription.displayName = "CardDescription"

export const CardContent = React.forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("p-5 pt-0", className)} {...props} />
  }
)
CardContent.displayName = "CardContent"

export const CardFooter = React.forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center p-5 pt-0", className)}
        {...props}
      />
    )
  }
)
CardFooter.displayName = "CardFooter"

export interface DefaultCardProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode
  padding?: boolean
  title?: string
  subtitle?: string
  action?: ReactNode
}

export const DefaultCard = React.forwardRef<HTMLDivElement, DefaultCardProps>(
  (
    { children, className, padding = true, title, subtitle, action, ...props },
    ref
  ) => {
    return (
      <Card ref={ref} className={className} {...props}>
        {title && (
          <div
            className={cn(
              "flex items-center justify-between",
              padding ? "mb-4" : "px-5 py-4 border-b border-gray-100"
            )}
          >
            <div>
              <h3 className="font-semibold text-gray-800">{title}</h3>
              {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
            </div>
            {action}
          </div>
        )}
        <div className={cn(padding && "p-5", title && "pt-0")}>{children}</div>
      </Card>
    )
  }
)
DefaultCard.displayName = "DefaultCard"

export default DefaultCard



