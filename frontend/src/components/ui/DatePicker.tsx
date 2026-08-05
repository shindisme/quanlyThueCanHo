import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";

interface DatePickerProps {
  className?: string;
  value?: Date | string | null;
  onChange?: (date: Date | null) => void;
  placeholder?: string;
  showTime?: boolean;
  disabled?: boolean;
}

const monthWordNames = [
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"
];

const weekdays = ["H", "B", "T", "N", "S", "B", "C"];

// Helper to parse date
const parseValueToDate = (val: Date | string | null | undefined): Date | null => {
  if (!val) return null;
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    return val;
  }
  if (typeof val === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      const [y, m, d] = val.split("-").map(Number);
      return new Date(y, m - 1, d);
    }
    const parsed = new Date(val);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return null;
};

// Format Date as DD/MM/YYYY
const formatToDMY = (date: Date | null, showTime = false): string => {
  if (!date) return "";
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  if (showTime) {
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return `${d}/${m}/${y} ${hh}:${mm}`;
  }
  return `${d}/${m}/${y}`;
};

// Parse DD/MM/YYYY
const parseDMY = (val: string, showTime = false): Date | null => {
  const trimmed = val.trim();
  if (showTime) {
    const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2})$/;
    const match = trimmed.match(regex);
    if (match) {
      const [, d, m, y, hh, mm] = match.map(Number);
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) {
        const date = new Date(y, m - 1, d, hh, mm);
        if (!isNaN(date.getTime())) return date;
      }
    }
  } else {
    const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = trimmed.match(regex);
    if (match) {
      const [, d, m, y] = match.map(Number);
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        const date = new Date(y, m - 1, d);
        if (!isNaN(date.getTime())) return date;
      }
    }
  }
  return null;
};

export function DatePicker({
  className,
  value,
  onChange,
  placeholder,
  showTime = false,
  disabled = false,
}: DatePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => parseValueToDate(value));
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date>(() => parseValueToDate(value) || new Date());

  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverCoords, setPopoverCoords] = useState({ top: 0, left: 0 });

  // Sync state with value prop
  useEffect(() => {
    const parsed = parseValueToDate(value);
    setSelectedDate(parsed);
    if (parsed) {
      setInputValue(formatToDMY(parsed, showTime));
      setCurrentDate(parsed);
    } else {
      setInputValue("");
    }
  }, [value, showTime]);

  // Position popover
  const updatePopoverPosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const popoverHeight = showTime ? 340 : 280;
      const spaceBelow = window.innerHeight - rect.bottom;
      let top = rect.bottom + window.scrollY;
      if (spaceBelow < popoverHeight && rect.top > popoverHeight) {
        top = rect.top - popoverHeight + window.scrollY;
      }
      setPopoverCoords({
        top,
        left: rect.left + window.scrollX,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePopoverPosition();
      window.addEventListener("scroll", updatePopoverPosition);
      window.addEventListener("resize", updatePopoverPosition);
    }
    return () => {
      window.removeEventListener("scroll", updatePopoverPosition);
      window.removeEventListener("resize", updatePopoverPosition);
    };
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        containerRef.current &&
        !containerRef.current.contains(target)
      ) {
        setIsOpen(false);
        setIsMonthOpen(false);
        setIsYearOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9/: ]/g, "");
    setInputValue(val);

    const parsed = parseDMY(val, showTime);
    if (parsed) {
      setSelectedDate(parsed);
      setCurrentDate(parsed);
      onChange?.(parsed);
    } else if (val.trim() === "") {
      setSelectedDate(null);
      onChange?.(null);
    }
  };

  const handleInputBlur = () => {
    // If invalid input, reset text back to selectedDate format
    if (selectedDate) {
      setInputValue(formatToDMY(selectedDate, showTime));
    } else {
      setInputValue("");
    }
  };

  // Month / Year grid math
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  const yearsList = useMemo(() => {
    const currentY = new Date().getFullYear();
    const list: number[] = [];
    for (let i = currentY - 100; i <= currentY + 30; i++) {
      list.push(i);
    }
    return list;
  }, []);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // Sunday=0
  const adjustedFirstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Monday=0

  const daysArray = useMemo(() => {
    const arr = [];
    // Prev month days
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = adjustedFirstDayIndex - 1; i >= 0; i--) {
      arr.push({ day: prevMonthDays - i, isCurrentMonth: false, monthOffset: -1 });
    }
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      arr.push({ day: i, isCurrentMonth: true, monthOffset: 0 });
    }
    // Next month days
    const remaining = 42 - arr.length;
    for (let i = 1; i <= remaining; i++) {
      arr.push({ day: i, isCurrentMonth: false, monthOffset: 1 });
    }
    return arr;
  }, [year, month, adjustedFirstDayIndex, daysInMonth]);

  const selectDate = (day: number, monthOffset: number) => {
    const targetDate = new Date(year, month + monthOffset, day);
    if (showTime && selectedDate) {
      targetDate.setHours(selectedDate.getHours());
      targetDate.setMinutes(selectedDate.getMinutes());
    }
    setSelectedDate(targetDate);
    setInputValue(formatToDMY(targetDate, showTime));
    onChange?.(targetDate);
    if (monthOffset !== 0) {
      setCurrentDate(targetDate);
    }
    if (!showTime) {
      setIsOpen(false);
    }
  };

  const handleMonthYearChange = (newYear: number, newMonth: number) => {
    setCurrentDate(new Date(newYear, newMonth, 1));
  };

  // Hour and Minute pickers for showTime
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const handleTimeChange = (type: "h" | "m", val: number) => {
    const baseDate = selectedDate ? new Date(selectedDate) : new Date();
    if (type === "h") {
      baseDate.setHours(val);
    } else {
      baseDate.setMinutes(val);
    }
    setSelectedDate(baseDate);
    setInputValue(formatToDMY(baseDate, showTime));
    onChange?.(baseDate);
  };

  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const yearListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isYearOpen && yearListRef.current) {
      const selectedEl = yearListRef.current.querySelector("[data-selected='true']");
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: "center" });
      }
    }
  }, [isYearOpen]);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => !disabled && setIsOpen(true)}
          disabled={disabled}
          placeholder={placeholder || (showTime ? "DD/MM/YYYY HH:mm" : "DD/MM/YYYY")}
          className={cn(
            "h-10 w-full rounded-md border border-gray-200 bg-white pl-3 pr-10 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm font-sans disabled:bg-gray-100 disabled:cursor-not-allowed",
            className
          )}
        />
        <CalendarIcon
          size={16}
          className={cn(
            "absolute right-3 text-gray-400 transition-colors",
            disabled ? "cursor-not-allowed opacity-50" : "hover:text-gray-600 cursor-pointer"
          )}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        />
      </div>

      {isOpen && createPortal(
        <div
          ref={popoverRef}
          style={{
            position: "absolute",
            top: `${popoverCoords.top}px`,
            left: `${popoverCoords.left}px`,
          }}
          className="z-9999 bg-white border border-gray-200 rounded-lg shadow-lg flex font-sans overflow-visible"
        >
          {/* Day Grid Panel */}
          <div className="p-3 w-65 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-100 relative z-20">
                <div className="flex items-center gap-1">
                  {/* Month Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMonthOpen((prev) => !prev);
                        setIsYearOpen(false);
                      }}
                      className="flex items-center gap-0.5 font-bold text-xs text-gray-800 hover:bg-gray-100 px-1.5 py-1 rounded cursor-pointer transition-colors"
                    >
                      <span>Tháng {monthWordNames[month]}</span>
                      <ChevronDown size={12} className="text-gray-500" />
                    </button>

                    {isMonthOpen && (
                      <div className="absolute top-full left-0 mt-1 w-28 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-xl z-30 py-1 text-xs divide-y divide-gray-50">
                        {monthWordNames.map((name, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              handleMonthYearChange(year, idx);
                              setIsMonthOpen(false);
                            }}
                            className={cn(
                              "w-full text-left px-3 py-1.5 hover:bg-primary-50 hover:text-primary-600 transition-colors font-medium cursor-pointer",
                              idx === month && "bg-primary-50 font-bold text-primary-600"
                            )}
                          >
                            Tháng {name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Year Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsYearOpen((prev) => !prev);
                        setIsMonthOpen(false);
                      }}
                      className="flex items-center gap-0.5 font-bold text-xs text-gray-800 hover:bg-gray-100 px-1.5 py-1 rounded cursor-pointer transition-colors"
                    >
                      <span>{year}</span>
                      <ChevronDown size={12} className="text-gray-500" />
                    </button>

                    {isYearOpen && (
                      <div
                        ref={yearListRef}
                        className="absolute top-full left-0 mt-1 w-24 max-h-40 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-xl z-30 py-1 text-xs scroll-smooth"
                      >
                        {yearsList.map((y) => (
                          <button
                            key={y}
                            type="button"
                            data-selected={y === year}
                            onClick={() => {
                              handleMonthYearChange(y, month);
                              setIsYearOpen(false);
                            }}
                            className={cn(
                              "w-full text-left px-3 py-1.5 hover:bg-primary-50 hover:text-primary-600 transition-colors font-medium cursor-pointer",
                              y === year && "bg-primary-600 text-white font-bold hover:bg-primary-700 hover:text-white"
                            )}
                          >
                            {y}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleMonthYearChange(year, month - 1)}
                    className="p-1 text-gray-400 hover:text-gray-650 hover:bg-gray-50 rounded transition-all cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMonthYearChange(year, month + 1)}
                    className="p-1 text-gray-400 hover:text-gray-650 hover:bg-gray-50 rounded transition-all cursor-pointer"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Weekday titles */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1 text-[10px] font-bold text-gray-400">
                {weekdays.map((w, idx) => (
                  <span key={idx}>{w}</span>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {daysArray.map((cell, idx) => {
                  const isSelected = selectedDate &&
                    selectedDate.getDate() === cell.day &&
                    selectedDate.getMonth() === month + cell.monthOffset &&
                    selectedDate.getFullYear() === year;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectDate(cell.day, cell.monthOffset)}
                      className={cn(
                        "h-7 w-full text-xs font-medium rounded transition-all cursor-pointer",
                        !cell.isCurrentMonth && "text-gray-300",
                        cell.isCurrentMonth && !isSelected && "text-gray-700 hover:bg-primary-50 hover:text-primary-600",
                        isSelected && "bg-primary-600 text-white font-semibold"
                      )}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Time Picker Panel (Optional) */}
          {showTime && (
            <div className="border-l border-gray-100 flex p-3 w-32.5 flex-col justify-between bg-gray-50/50">
              <div className="h-full flex flex-col justify-between space-y-2">
                <div className="text-center font-bold text-xs text-gray-800 pb-2 border-b border-gray-100">
                  Thời gian
                </div>

                <div className="flex gap-2 justify-center flex-1 min-h-0 overflow-y-auto">
                  {/* Hours */}
                  <div className="flex flex-col overflow-y-auto max-h-40 scrollbar-none pr-1">
                    {hours.map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => handleTimeChange("h", h)}
                        className={cn(
                          "px-2 py-1 text-xs rounded transition-all cursor-pointer",
                          selectedDate?.getHours() === h
                            ? "bg-primary-600 text-white font-bold"
                            : "text-gray-650 hover:bg-primary-50 hover:text-primary-600"
                        )}
                      >
                        {String(h).padStart(2, "0")}
                      </button>
                    ))}
                  </div>
                  {/* Minutes */}
                  <div className="flex flex-col overflow-y-auto max-h-40 scrollbar-none pl-1">
                    {minutes.filter(m => m % 5 === 0).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleTimeChange("m", m)}
                        className={cn(
                          "px-2 py-1 text-xs rounded transition-all cursor-pointer",
                          selectedDate?.getMinutes() === m
                            ? "bg-primary-600 text-white font-bold"
                            : "text-gray-650 hover:bg-primary-50 hover:text-primary-600"
                        )}
                      >
                        {String(m).padStart(2, "0")}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 text-center">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="w-full py-1 text-[11px] font-bold text-white bg-primary-600 hover:bg-primary-700 rounded transition-colors cursor-pointer"
                  >
                    Xác nhận
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

export default DatePicker;
