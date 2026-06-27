import { cn } from "../../lib/utils"

interface DatePickerProps {
  className?: string
  value?: Date | null
  onChange?: (date: Date) => void
  placeholder?: string
}

export function DatePicker({
  className,
  value,
  onChange,
  placeholder,
}: DatePickerProps) {
  const formatDateForInput = (date: Date | null | undefined): string => {
    if (!date) return ""
    const d = new Date(date)
    if (isNaN(d.getTime())) return ""
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (!val) return
    const parsedDate = new Date(val)
    if (!isNaN(parsedDate.getTime())) {
      onChange?.(parsedDate)
    }
  }

  return (
    <input
      type="date"
      value={formatDateForInput(value)}
      onChange={handleInputChange}
      placeholder={placeholder}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all shadow-sm cursor-pointer",
        className
      )}
    />
  )
}
export default DatePicker
