import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "../../lib/utils"

interface CalendarProps {
  className?: string
  selected?: Date | null
  onSelect?: (date: Date) => void
}

export function Calendar({ className, selected, onSelect }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(selected || new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayIndex = new Date(year, month, 1).getDay()

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const handleSelectDay = (day: number) => {
    const newSelected = new Date(year, month, day)
    onSelect?.(newSelected)
  }

  const weekdays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
  const monthNames = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ]

  const cells = []
  for (let i = 0; i < firstDayIndex; i++) {
    cells.push(<div key={`empty-${i}`} className="w-8 h-8" />)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const isSelected =
      selected &&
      date.getDate() === selected.getDate() &&
      date.getMonth() === selected.getMonth() &&
      date.getFullYear() === selected.getFullYear()
    
    const isToday =
      new Date().getDate() === day &&
      new Date().getMonth() === month &&
      new Date().getFullYear() === year

    cells.push(
      <button
        key={`day-${day}`}
        type="button"
        onClick={() => handleSelectDay(day)}
        className={cn(
          "w-8 h-8 flex items-center justify-center text-xs font-semibold rounded-md transition-colors cursor-pointer",
          isSelected
            ? "bg-primary-600 text-white shadow-sm"
            : isToday
            ? "bg-gray-100 text-primary-600 font-bold"
            : "text-gray-700 hover:bg-gray-100"
        )}
      >
        {day}
      </button>
    )
  }

  return (
    <div className={cn("p-3 bg-white border border-gray-200 rounded-lg shadow-sm w-fit font-sans", className)}>
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-50 cursor-pointer"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-xs font-bold text-gray-800">
          {monthNames[month]} / {year}
        </span>
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-50 cursor-pointer"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-1 text-[10px] font-bold text-gray-400">
        {weekdays.map((day) => (
          <div key={day} className="w-8">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {cells}
      </div>
    </div>
  )
}
