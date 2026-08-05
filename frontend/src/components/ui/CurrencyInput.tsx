import React, { useState, useEffect } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

export interface CurrencyInputProps {
  label?: string;
  error?: string;
  value?: number | string;
  onChange?: (value: number) => void;
  className?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      label,
      error,
      value = 0,
      onChange,
      className,
      disabled = false,
      min = 0,
      max = 1000000000000,
      step = 1000,
    },
    ref
  ) => {
    const formatDisplay = (val: number | string | undefined): string => {
      if (val === undefined || val === null || val === "" || isNaN(Number(val))) return "0";
      const num = Number(val);
      return new Intl.NumberFormat("vi-VN").format(num);
    };

    const [displayValue, setDisplayValue] = useState<string>(formatDisplay(value));

    useEffect(() => {
      setDisplayValue(formatDisplay(value));
    }, [value]);

    const updateValue = (newNum: number) => {
      let clamped = newNum;
      if (min !== undefined && clamped < min) clamped = min;
      if (max !== undefined && clamped > max) clamped = max;

      setDisplayValue(formatDisplay(clamped));
      onChange?.(clamped);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputVal = e.target.value;
      const rawDigits = inputVal.replace(/\D/g, "");

      if (!rawDigits) {
        setDisplayValue("0");
        onChange?.(0);
        return;
      }

      let numValue = parseInt(rawDigits, 10);
      if (max !== undefined && numValue > max) {
        numValue = max;
      }
      updateValue(numValue);
    };

    const handleIncrement = () => {
      if (disabled) return;
      const currentNum = Number(String(value || 0).replace(/\D/g, "")) || 0;
      updateValue(currentNum + step);
    };

    const handleDecrement = () => {
      if (disabled) return;
      const currentNum = Number(String(value || 0).replace(/\D/g, "")) || 0;
      updateValue(currentNum - step);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        handleIncrement();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        handleDecrement();
      }
    };

    return (
      <div className="w-full font-sans">
        {label && (
          <label className="block text-sm font-semibold text-gray-700 mb-1.5 select-none">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <input
            ref={ref}
            type="text"
            inputMode="numeric"
            value={displayValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className={cn(
              "flex h-10 w-full rounded-md border border-gray-200 bg-white pl-3 pr-8 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors shadow-sm font-medium",
              error && "border-danger-500 focus:ring-danger-500",
              className
            )}
          />
          {/* Nút bấm chọn */}
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col items-center border-l border-gray-200 pl-1 pr-1 py-0.5">
            <button
              type="button"
              tabIndex={-1}
              onClick={handleIncrement}
              disabled={disabled}
              className="text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer p-0.5"
              title="Tăng"
            >
              <ChevronUp size={12} />
            </button>
            <button
              type="button"
              tabIndex={-1}
              onClick={handleDecrement}
              disabled={disabled}
              className="text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer p-0.5"
              title="Giảm"
            >
              <ChevronDown size={12} />
            </button>
          </div>
        </div>
        {error && <p className="mt-1 text-xs text-danger-500 select-none">{error}</p>}
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export default CurrencyInput;
