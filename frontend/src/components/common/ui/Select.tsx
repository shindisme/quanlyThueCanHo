import { cn } from "../../../lib/utils";
import type { SelectHTMLAttributes } from "react";
import { forwardRef } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm",
            "bg-white text-gray-800",
            "focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500",
            "transition-colors duration-150 cursor-pointer",
            error && "border-danger-500",
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1 text-xs text-danger-500">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;
