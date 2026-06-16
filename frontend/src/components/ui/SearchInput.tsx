import { cn } from "../../lib/utils";
import { Search } from "lucide-react";
import { useState, useEffect, useRef } from "react";

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
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onChangeRef.current(localValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [localValue]);

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
        className="premium-input w-full !pl-10 !pr-4 py-2.5 rounded-xl text-sm bg-white text-gray-800 placeholder:text-gray-400"
      />
    </div>
  );
}
