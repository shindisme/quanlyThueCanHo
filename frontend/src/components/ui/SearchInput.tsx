import { cn } from "../../lib/utils";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";

// O tim kiem voi debounce - cho 300ms sau khi nguoi dung ngung go moi goi onChange
// Tranh goi qua nhieu lan khi go nhanh
interface SearchInputProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchInput({
  value: externalValue,
  onChange,
  placeholder = "Tim kiem...",
  className,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(externalValue || "");

  // Debounce: doi 300ms roi moi goi onChange
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [localValue, onChange]);

  // Dong bo khi gia tri ben ngoai thay doi
  useEffect(() => {
    if (externalValue !== undefined) {
      setLocalValue(externalValue);
    }
  }, [externalValue]);

  return (
    <div className={cn("relative", className)}>
      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="premium-input pl-10 pr-4 py-2.5 rounded-xl text-sm bg-white text-gray-800 placeholder:text-gray-400"
      />
    </div>
  );
}
