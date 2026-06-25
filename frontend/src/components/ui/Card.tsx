import type { ReactNode, ComponentProps } from "react"
import { cn } from "../../lib/utils"

function Card({ className, ref, ...props }: ComponentProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "border border-gray-200/80 bg-white rounded-xl shadow-sm hover:shadow transition-all duration-200",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ref, ...props }: ComponentProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-5 border-b border-gray-100", className)}
      {...props}
    />
  )
}

function CardTitle({ className, ref, ...props }: ComponentProps<"h3">) {
  return (
    <h3
      ref={ref}
      className={cn("font-semibold text-gray-800 leading-none tracking-tight", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ref, ...props }: ComponentProps<"p">) {
  return (
    <p
      ref={ref}
      className={cn("text-xs text-gray-400 mt-0.5", className)}
      {...props}
    />
  )
}

function CardContent({ className, ref, ...props }: ComponentProps<"div">) {
  return <div ref={ref} className={cn("p-5 pt-0", className)} {...props} />
}

function CardFooter({ className, ref, ...props }: ComponentProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("flex items-center p-5 pt-0", className)}
      {...props}
    />
  )
}

interface DefaultCardProps extends ComponentProps<"div"> {
  children: ReactNode
  padding?: boolean
  title?: string
  subtitle?: string
  action?: ReactNode
}

function DefaultCard({
  children,
  className,
  padding = true,
  title,
  subtitle,
  action,
  ref,
  ...props
}: DefaultCardProps) {
  return (
    <Card ref={ref} className={className} {...props}>
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
    </Card>
  )
}

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
}

export default DefaultCard
