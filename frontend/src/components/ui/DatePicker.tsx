import { useState, useRef, useEffect } from "react"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "./Calendar"
import { cn } from "../../lib/utils"
import { formatDate } from "../../utils/format"

interface DatePickerProps {
  className?: string
  value?: Date | null
  onChange?: (date: Date) => void
  placeholder?: string
}

export function DatePicker({
  className,
  value: externalValue,
  onChange,
  placeholder = "Chọn ngày...",
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [localValue, setLocalValue] = useState<Date | null>(null)
  
  const isControlled = externalValue !== undefined
  const value = isControlled ? externalValue : localValue

  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)

  const handleSelect = (date: Date) => {
    if (!isControlled) {
      setLocalValue(date)
    }
    onChange?.(date)
    setOpen(false)
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        open &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  return (
    <div className={cn("relative inline-block w-full text-left font-sans", className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all cursor-pointer shadow-sm",
          !value && "text-gray-400"
        )}
      >
        <span className="truncate">{value ? formatDate(value) : placeholder}</span>
        <CalendarIcon size={16} className="text-gray-400 shrink-0 ml-2" />
      </button>

      {open && (
        <div
          ref={popoverRef}
          className="absolute z-50 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden animate-scale-in"
        >
          <Calendar selected={value} onSelect={handleSelect} />
        </div>
      )}
    </div>
  )
}

