import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { Calendar as CalendarIcon, ArrowUp, ArrowDown, ChevronDown } from "lucide-react"
import { cn } from "../../lib/utils"
import { formatDate, formatDateTime } from "../../utils/date"

interface CalendarProps {
  className?: string
  value?: Date | string | null
  onChange?: (date: Date | null) => void
  placeholder?: string
  popoverPosition?: "up" | "down" | "auto"
  showTime?: boolean
}

const monthWordNames = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12"
]

const weekdays = ["H", "B", "T", "N", "S", "B", "C"]

const hideScrollbarStyle = {
  scrollbarWidth: "none" as const,
  msOverflowStyle: "none" as const,
}

// Helper to parse string or Date to a local Date object safely without timezone shift
const parseValueToDate = (val: Date | string | null | undefined): Date | null => {
  if (!val) return null
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null
    return val
  }
  if (typeof val === "string") {
    // Handle YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      const [y, m, d] = val.split("-").map(Number)
      return new Date(y, m - 1, d)
    }
    // Handle standard date strings
    const parsed = new Date(val)
    if (!isNaN(parsed.getTime())) return parsed
  }
  return null
}

export function Calendar({
  className,
  value,
  onChange,
  placeholder = "Chọn ngày...",
  popoverPosition = "auto",
  showTime = false,
}: CalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => parseValueToDate(value))
  const [isOpen, setIsOpen] = useState(false)
  const [currentDate, setCurrentDate] = useState<Date>(() => parseValueToDate(value) || new Date())
  const containerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const [popoverCoords, setPopoverCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 })

  // Time States
  const [selectedHour, setSelectedHour] = useState<number>(9)
  const [selectedMinute, setSelectedMinute] = useState<number>(0)
  const [selectedPeriod, setSelectedPeriod] = useState<"SA" | "CH">("SA")

  const hourRef = useRef<HTMLDivElement>(null)
  const minuteRef = useRef<HTMLDivElement>(null)

  const toggleOpen = () => {
    setIsOpen(!isOpen)
  }

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement
      if (!target) return

      // Do not close when clicking dropdown select or option
      if (
        target.tagName === "SELECT" ||
        target.tagName === "OPTION" ||
        target.closest("select")
      ) {
        return
      }

      if (
        containerRef.current && !containerRef.current.contains(target) &&
        popoverRef.current && !popoverRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Calculate and sync popover coordinate positioning
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const updatePosition = () => {
        const rect = containerRef.current!.getBoundingClientRect()
        const spaceBelow = window.innerHeight - rect.bottom
        const calendarHeight = showTime ? 310 : 280
        const popoverWidth = showTime ? 410 : 260

        let top = rect.bottom + window.scrollY
        if (popoverPosition === "up" || (popoverPosition === "auto" && spaceBelow < calendarHeight && rect.top > calendarHeight)) {
          top = rect.top + window.scrollY - calendarHeight - 4
        } else {
          top = rect.bottom + window.scrollY + 4
        }

        let left = rect.left + window.scrollX
        if (left + popoverWidth > window.innerWidth + window.scrollX) {
          left = window.innerWidth + window.scrollX - popoverWidth - 10
        }
        if (left < 0) {
          left = 10
        }

        setPopoverCoords({ top, left })
      }

      updatePosition()
      window.addEventListener("resize", updatePosition)
      window.addEventListener("scroll", updatePosition, true)

      return () => {
        window.removeEventListener("resize", updatePosition)
        window.removeEventListener("scroll", updatePosition, true)
      }
    }
  }, [isOpen, showTime, popoverPosition])

  // Sync internal states when value changes
  useEffect(() => {
    const parsed = parseValueToDate(value)
    const prevTime = selectedDate ? selectedDate.getTime() : null
    const nextTime = parsed ? parsed.getTime() : null

    if (nextTime !== prevTime) {
      setSelectedDate(parsed)
      if (parsed) {
        setCurrentDate(parsed)

        let h = parsed.getHours()
        const m = parsed.getMinutes()
        const p = h >= 12 ? "CH" : "SA"
        if (h >= 12) {
          if (h > 12) h -= 12
        } else {
          if (h === 0) h = 12
        }
        setSelectedHour(h)
        setSelectedMinute(m)
        setSelectedPeriod(p)
      } else {
        setCurrentDate(new Date())
      }
    }
  }, [value])

  // Auto-scroll time columns to selected values when open
  useEffect(() => {
    if (isOpen && showTime) {
      setTimeout(() => {
        if (hourRef.current) {
          const selectedHourButton = hourRef.current.querySelector(`[data-hour="${selectedHour}"]`)
          if (selectedHourButton) {
            selectedHourButton.scrollIntoView({ block: "center", behavior: "auto" })
          }
        }
        if (minuteRef.current) {
          const selectedMinuteButton = minuteRef.current.querySelector(`[data-minute="${selectedMinute}"]`)
          if (selectedMinuteButton) {
            selectedMinuteButton.scrollIntoView({ block: "center", behavior: "auto" })
          }
        }
      }, 50)
    }
  }, [isOpen, showTime, selectedHour, selectedMinute])

  const updateSelectedDatePart = (newYear: number, newMonth: number) => {
    const activeDay = selectedDate ? selectedDate.getDate() : 1
    const maxDays = new Date(newYear, newMonth + 1, 0).getDate()
    const targetDay = Math.min(activeDay, maxDays)

    let targetHour = selectedHour
    if (selectedPeriod === "CH") {
      if (targetHour < 12) targetHour += 12
    } else {
      if (targetHour === 12) targetHour = 0
    }

    const nextDate = new Date(
      newYear,
      newMonth,
      targetDay,
      showTime ? targetHour : 0,
      showTime ? selectedMinute : 0,
      0
    )

    setCurrentDate(nextDate)
    setSelectedDate(nextDate)
    onChange?.(nextDate)
  }

  const handleSelectDay = (day: number) => {
    let targetHour = selectedHour
    if (selectedPeriod === "CH") {
      if (targetHour < 12) targetHour += 12
    } else {
      if (targetHour === 12) targetHour = 0
    }

    const selected = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day,
      showTime ? targetHour : 0,
      showTime ? selectedMinute : 0,
      0
    )
    onChange?.(selected)
    if (!showTime) {
      setIsOpen(false)
    }
  }

  const handleSelectTime = (h: number, m: number, p: "SA" | "CH") => {
    const baseDate = value ? new Date(value) : new Date()

    let targetHour = h
    if (p === "CH") {
      if (targetHour < 12) targetHour += 12
    } else {
      if (targetHour === 12) targetHour = 0
    }

    const selected = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      targetHour,
      m,
      0
    )
    onChange?.(selected)
  }

  const handleClear = () => {
    onChange?.(null)
    setIsOpen(false)
  }

  const handleSelectToday = () => {
    const now = new Date()
    onChange?.(now)
    if (!showTime) {
      setIsOpen(false)
    }
  }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Calculate first day index (Monday start: Mon=0, Tue=1, ..., Sun=6)
  let firstDayIndex = new Date(year, month, 1).getDay()
  firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1

  // Previous month trailing days
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const handlePrevMonth = () => {
    updateSelectedDatePart(year, month - 1)
  }

  const handleNextMonth = () => {
    updateSelectedDatePart(year, month + 1)
  }

  const cells = []

  // Add trailing days from previous month
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i
    cells.push(
      <div
        key={`prev-${day}`}
        className="w-8 h-8 flex items-center justify-center text-xs font-semibold text-gray-300 select-none pointer-events-none"
      >
        {day}
      </div>
    )
  }

  // Add days of current month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const isSelected =
      selectedDate &&
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()

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
            ? "bg-primary-600 text-white shadow-sm ring-1 ring-primary-600"
            : isToday
              ? "bg-gray-100 text-primary-600 font-bold"
              : "text-gray-700 hover:bg-gray-100"
        )}
      >
        {day}
      </button>
    )
  }

  // Add leading days of next month to fill a full 6-week grid (42 cells)
  const totalCells = firstDayIndex + daysInMonth
  const nextMonthDays = 42 - totalCells
  for (let day = 1; day <= nextMonthDays; day++) {
    cells.push(
      <div
        key={`next-${day}`}
        className="w-8 h-8 flex items-center justify-center text-xs font-semibold text-gray-300 select-none pointer-events-none"
      >
        {day}
      </div>
    )
  }

  // Danh sách năm (cách 60 năm trước tới 10 năm sau), hiển thị giảm dần (descending) để dễ chọn năm sinh gần đây
  const currentYear = new Date().getFullYear()
  const yearsList = Array.from({ length: 71 }, (_, i) => (currentYear + 10) - i)

  const hoursList = Array.from({ length: 12 }, (_, i) => i + 1)
  const minutesList = Array.from({ length: 60 }, (_, i) => i)

  return (
    <div className="relative w-full" ref={containerRef}>
      <style dangerouslySetInnerHTML={{
        __html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />

      <button
        type="button"
        onClick={toggleOpen}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm cursor-pointer text-left",
          className
        )}
      >
        <span className={selectedDate ? "text-gray-800" : "text-gray-400"}>
          {selectedDate ? (showTime ? formatDateTime(selectedDate) : formatDate(selectedDate)) : placeholder}
        </span>
        <CalendarIcon size={16} className="text-gray-400 ml-2" />
      </button>

      {isOpen && createPortal(
        <div
          ref={popoverRef}
          style={{
            position: "absolute",
            top: `${popoverCoords.top}px`,
            left: `${popoverCoords.left}px`,
          }}
          className="z-9999 bg-white border border-gray-200 rounded-lg shadow-lg flex font-sans overflow-hidden"
        >
          {/* Day Grid Panel */}
          <div className="p-3 w-[260px] flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-100">
                <div className="flex items-center gap-1">
                  {/* Month Dropdown */}
                  <div className="relative flex items-center gap-0.5 font-bold text-xs text-gray-800 hover:bg-gray-50 px-1.5 py-0.5 rounded cursor-pointer transition-colors">
                    <span>Tháng {monthWordNames[month]}</span>
                    <ChevronDown size={12} className="text-gray-500" />
                    <select
                      value={month}
                      onChange={(e) => {
                        const m = Number(e.target.value)
                        updateSelectedDatePart(year, m)
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    >
                      {monthWordNames.map((name, idx) => (
                        <option key={idx} value={idx}>
                          Tháng {name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Year Dropdown */}
                  <div className="relative flex items-center gap-0.5 font-bold text-xs text-gray-800 hover:bg-gray-50 px-1.5 py-0.5 rounded cursor-pointer transition-colors">
                    <span>{year}</span>
                    <ChevronDown size={12} className="text-gray-500" />
                    <select
                      value={year}
                      onChange={(e) => {
                        const y = Number(e.target.value)
                        updateSelectedDatePart(y, month)
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    >
                      {yearsList.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>
              </div>

              {/* Weekdays */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1 text-[11px] font-bold text-gray-400">
                {weekdays.map((day, idx) => (
                  <div key={`${day}-${idx}`} className="w-8">
                    {day}
                  </div>
                ))}
              </div>

              {/* Cells */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {cells}
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={handleClear}
                className="text-xs font-bold text-primary-600 hover:text-primary-700 cursor-pointer px-2 py-1 rounded hover:bg-gray-50 transition-colors"
              >
                Xóa
              </button>
              <button
                type="button"
                onClick={handleSelectToday}
                className="text-xs font-bold text-primary-600 hover:text-primary-700 cursor-pointer px-2 py-1 rounded hover:bg-gray-50 transition-colors"
              >
                Hôm nay
              </button>
            </div>
          </div>

          {/* Time Picker Panel */}
          {showTime && (
            <div className="flex border-l border-gray-100 p-2 gap-1 h-[290px] w-[150px]">
              {/* Hour column */}
              <div
                ref={hourRef}
                className="no-scrollbar overflow-y-auto h-full w-11 flex flex-col gap-0.5"
                style={{
                  ...hideScrollbarStyle,
                  paddingTop: "128px",
                  paddingBottom: "128px",
                }}
              >
                {hoursList.map((h) => {
                  const hStr = h.toString().padStart(2, "0")
                  const isSelected = selectedHour === h
                  return (
                    <button
                      key={h}
                      type="button"
                      data-hour={h}
                      onClick={() => {
                        setSelectedHour(h)
                        handleSelectTime(h, selectedMinute, selectedPeriod)
                      }}
                      className={cn(
                        "w-9 h-8 shrink-0 flex items-center justify-center text-xs font-semibold rounded-md transition-colors cursor-pointer",
                        isSelected
                          ? "bg-primary-600 text-white shadow-sm font-bold"
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      {hStr}
                    </button>
                  )
                })}
              </div>

              {/* Minute column */}
              <div
                ref={minuteRef}
                className="no-scrollbar overflow-y-auto h-full w-11 flex flex-col gap-0.5"
                style={{
                  ...hideScrollbarStyle,
                  paddingTop: "128px",
                  paddingBottom: "128px",
                }}
              >
                {minutesList.map((m) => {
                  const mStr = m.toString().padStart(2, "0")
                  const isSelected = selectedMinute === m
                  return (
                    <button
                      key={m}
                      type="button"
                      data-minute={m}
                      onClick={() => {
                        setSelectedMinute(m)
                        handleSelectTime(selectedHour, m, selectedPeriod)
                      }}
                      className={cn(
                        "w-9 h-8 shrink-0 flex items-center justify-center text-xs font-semibold rounded-md transition-colors cursor-pointer",
                        isSelected
                          ? "bg-primary-600 text-white shadow-sm font-bold"
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      {mStr}
                    </button>
                  )
                })}
              </div>

              {/* Period Column */}
              <div className="flex flex-col gap-1 justify-center w-10 h-full">
                {["SA", "CH"].map((p) => {
                  const isSelected = selectedPeriod === p
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setSelectedPeriod(p as "SA" | "CH")
                        handleSelectTime(selectedHour, selectedMinute, p as "SA" | "CH")
                      }}
                      className={cn(
                        "w-9 h-8 flex items-center justify-center text-xs font-semibold rounded-md transition-colors cursor-pointer",
                        isSelected
                          ? "bg-primary-600 text-white shadow-sm font-bold animate-none"
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      {p}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}

export default Calendar


