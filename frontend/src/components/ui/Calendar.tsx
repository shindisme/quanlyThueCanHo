import { useState, useRef, useEffect } from "react"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"
import { cn } from "../../lib/utils"
import { formatDate } from "../../utils/date"

interface CalendarProps {
  className?: string
  value?: Date | null
  onChange?: (date: Date) => void
  placeholder?: string
  popoverPosition?: "up" | "down" | "auto"
}

export function Calendar({
  className,
  value,
  onChange,
  placeholder = "Chọn ngày...",
  popoverPosition = "auto",
}: CalendarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentDate, setCurrentDate] = useState(value || new Date())
  const containerRef = useRef<HTMLDivElement>(null)
  const [calculatedPosition, setCalculatedPosition] = useState<"up" | "down">("down")

  const toggleOpen = () => {
    if (!isOpen) {
      if (popoverPosition === "auto") {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect()
          const spaceBelow = window.innerHeight - rect.bottom
          const calendarHeight = 280
          if (spaceBelow < calendarHeight && rect.top > calendarHeight) {
            setCalculatedPosition("up")
          } else {
            setCalculatedPosition("down")
          }
        }
      } else {
        setCalculatedPosition(popoverPosition)
      }
    }
    setIsOpen(!isOpen)
  }

  useEffect(() => {
    if (value) {
      setCurrentDate(new Date(value))
    }
  }, [value])

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleSelectDay = (day: number) => {
    const selected = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    onChange?.(selected)
    setIsOpen(false)
  }

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

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = Number(e.target.value)
    setCurrentDate(new Date(year, newMonth, 1))
  }

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = Number(e.target.value)
    setCurrentDate(new Date(newYear, month, 1))
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
      value &&
      date.getDate() === value.getDate() &&
      date.getMonth() === value.getMonth() &&
      date.getFullYear() === value.getFullYear()
    
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
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={toggleOpen}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm cursor-pointer text-left",
          className
        )}
      >
        <span className={value ? "text-gray-800" : "text-gray-400"}>
          {value ? formatDate(value) : placeholder}
        </span>
        <CalendarIcon size={16} className="text-gray-400 ml-2" />
      </button>

      {isOpen && (
        <div className={cn(
          "absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-fit font-sans",
          calculatedPosition === "up" ? "bottom-full mb-1" : "top-full mt-1"
        )}>
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-1">
              <select
                value={month}
                onChange={handleMonthChange}
                className="text-xs font-bold text-gray-800 bg-transparent border-none outline-none focus:ring-0 cursor-pointer p-0 pr-1"
              >
                {monthNames.map((name, idx) => (
                  <option key={idx} value={idx}>{name}</option>
                ))}
              </select>
              <span className="text-gray-400 text-xs">/</span>
              <select
                value={year}
                onChange={handleYearChange}
                className="text-xs font-bold text-gray-800 bg-transparent border-none outline-none focus:ring-0 cursor-pointer p-0"
              >
                {Array.from({ length: 100 }, (_, i) => {
                  const y = new Date().getFullYear() - 80 + i;
                  return (
                    <option key={y} value={y}>{y}</option>
                  );
                })}
              </select>
            </div>
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
      )}
    </div>
  )
}

export default Calendar
