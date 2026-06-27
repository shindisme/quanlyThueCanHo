import { cn } from "../../lib/utils"
import { Search } from "lucide-react"
import { useState, useEffect, useRef } from "react"

interface SearchInputProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function SearchInput({
  value: externalValue,
  onChange,
  placeholder = "Tìm kiếm...",
  className,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(externalValue || "")
  const lastSentValueRef = useRef(externalValue || "")

  useEffect(() => {
    if (externalValue !== undefined) {
      setLocalValue(externalValue)
      lastSentValueRef.current = externalValue
    }
  }, [externalValue])

  useEffect(() => {
    if (localValue === lastSentValueRef.current) return
    const timer = setTimeout(() => {
      onChange(localValue)
      lastSentValueRef.current = localValue
    }, 300)
    return () => clearTimeout(timer)
  }, [localValue, onChange])

  return (
    <div className={cn("relative", className)}>
      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="flex h-10 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-850 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all"
      />
    </div>
  )
}
