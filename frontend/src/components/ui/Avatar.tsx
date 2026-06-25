import type { ComponentProps } from "react"
import { cn } from "../../lib/utils"

function DefaultAvatar({ className, ref, ...props }: ComponentProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-white",
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({ className, ref, alt, ...props }: ComponentProps<"img">) {
  return (
    <img
      ref={ref}
      className={cn("aspect-square h-full w-full object-cover", className)}
      alt={alt}
      {...props}
    />
  )
}

function AvatarFallback({ className, ref, ...props }: ComponentProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center bg-gray-100 text-gray-500 font-medium",
        className
      )}
      {...props}
    />
  )
}

const sizeStyles = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
}

interface DefaultAvatarProps {
  src?: string | null
  name: string
  size?: "sm" | "md" | "lg"
  className?: string
}

function Avatar({ src, name, size = "md", className }: DefaultAvatarProps) {
  return (
    <DefaultAvatar className={cn(sizeStyles[size], className)}>
      {src ? (
        <AvatarImage src={src} alt={name} />
      ) : (
        <AvatarFallback>
          <svg viewBox="0 0 24 24" className="w-2/3 h-2/3 text-gray-400" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </AvatarFallback>
      )}
    </DefaultAvatar>
  )
}

export {
  DefaultAvatar,
  AvatarImage,
  AvatarFallback,
}

export default Avatar
