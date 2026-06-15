import { cn } from "../../lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";


type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-primary-600 text-white hover:bg-primary-600/90 shadow",
  secondary: "bg-gray-100 text-gray-900 hover:bg-gray-100/80 shadow-sm",
  outline: "border border-gray-200 bg-white hover:bg-gray-100 hover:text-gray-900 shadow-sm",
  ghost: "hover:bg-gray-100 hover:text-gray-900",
  danger: "bg-danger-500 text-white hover:bg-danger-500/90 shadow-sm",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-xs",
  md: "h-10 px-4 py-2 text-sm font-medium",
  lg: "h-11 px-8 text-base font-medium",
};

export default function Button({
  variant = "primary",
  size = "md",
  children,
  isLoading = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
