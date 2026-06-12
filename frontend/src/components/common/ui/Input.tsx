import { cn } from "../../../lib/utils";
import type { InputHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

// forwardRef de tuong thich voi react-hook-form (can ref de theo doi input)
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm",
              "bg-white text-gray-800",
              "placeholder:text-gray-400",
              "focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500",
              "transition-colors duration-150",
              icon && "pl-10",
              error && "border-danger-500 focus:border-danger-500 focus:ring-danger-500",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-xs text-danger-500">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
