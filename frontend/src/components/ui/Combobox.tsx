import { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { Check, ChevronDown, X } from "lucide-react"
import { cn } from "../../lib/utils"
import { removeVietnameseTones } from "../../utils/string"

export interface ComboboxOption {
  value: string
  label: string
  disabled?: boolean
  searchKeywords?: string | string[]
}

export interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  label?: string
  error?: string
  className?: string
  triggerClassName?: string
  disabled?: boolean
  clearable?: boolean
  searchable?: boolean
}

export function Combobox({
  options = [],
  value = "",
  onChange,
  placeholder = "Chọn...",
  searchPlaceholder = "Tìm kiếm...",
  label,
  error,
  className,
  triggerClassName,
  disabled = false,
  clearable = true,
  searchable = true,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [dropdownCoords, setDropdownCoords] = useState({ top: 0, left: 0, width: 0 })

  const safeOptions = Array.isArray(options) ? options.filter(Boolean) : []

  const updateDropdownPosition = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const dropdownHeight = 260
      const spaceBelow = window.innerHeight - rect.bottom
      let top = rect.bottom + 4 + window.scrollY
      if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
        top = Math.max(10, rect.top - dropdownHeight - 4 + window.scrollY)
      }
      setDropdownCoords({
        top,
        left: rect.left + window.scrollX,
        width: rect.width,
      })
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition()
      window.addEventListener("scroll", updateDropdownPosition, true)
      window.addEventListener("resize", updateDropdownPosition)
    }
    return () => {
      window.removeEventListener("scroll", updateDropdownPosition, true)
      window.removeEventListener("resize", updateDropdownPosition)
    }
  }, [isOpen, updateDropdownPosition])

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Reset ô tìm kiếm khi đóng dropdown
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("")
    }
  }, [isOpen])

  const selectedOption = safeOptions.find((opt) => String(opt?.value ?? "") === String(value ?? ""))

  const handleSelect = (val: string, disabledOption?: boolean) => {
    if (disabledOption) return
    onChange(val)
    setIsOpen(false)
    setSearchQuery("")
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange("")
    setSearchQuery("")
  }

  const calculateRelevanceScore = (opt: ComboboxOption, rawQuery: string): number => {
    const query = rawQuery.trim().toLowerCase()
    if (!query) return 1

    const queryNoTone = removeVietnameseTones(query)
    const labelRaw = (opt.label || "").toLowerCase()
    const labelNoTone = removeVietnameseTones(opt.label || "")
    const valueRaw = String(opt.value || "").toLowerCase()

    if (labelRaw === query) return 10000
    if (labelRaw.startsWith(query)) return 8000
    if (labelRaw.includes(query)) return 5000

    if (opt.searchKeywords) {
      const kws = Array.isArray(opt.searchKeywords) ? opt.searchKeywords : [opt.searchKeywords]
      for (const kw of kws) {
        const kwRaw = String(kw || "").toLowerCase()
        const kwNoTone = removeVietnameseTones(kwRaw)
        if (kwRaw === query) return 9000
        if (kwRaw.startsWith(query)) return 7000
        if (kwRaw.includes(query)) return 4500
        if (kwNoTone === queryNoTone) return 4000
        if (kwNoTone.startsWith(queryNoTone)) return 3500
        if (kwNoTone.includes(queryNoTone)) return 2500
      }
    }

    if (labelNoTone === queryNoTone) return 4000
    if (labelNoTone.startsWith(queryNoTone)) return 3500

    const words = labelNoTone.split(/[\s,()\-]+/).filter(Boolean)
    const queryWords = queryNoTone.split(/[\s,()\-]+/).filter(Boolean)
    const isExactWordMatch = queryWords.every((qw) => words.includes(qw))
    if (isExactWordMatch) return 3000

    const isAllWordsPrefix = queryWords.every((qw) => words.some((w) => w.startsWith(qw)))
    if (isAllWordsPrefix) return 2000

    if (labelNoTone.includes(queryNoTone)) return 500

    if (valueRaw === query || valueRaw.includes(query)) return 400

    return 0
  }

  const filteredOptions = safeOptions
    .map((opt) => ({ opt, score: calculateRelevanceScore(opt, searchQuery) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.opt)

  // Nhãn hiển thị tạm thời khi đang tìm kiếm
  const dynamicPlaceholder = isOpen
    ? (selectedOption ? `${selectedOption.label} - ${searchPlaceholder || "Tìm kiếm..."}` : (searchPlaceholder || placeholder))
    : (selectedOption ? selectedOption.label : placeholder)

  // Giá trị trong ô input
  const dynamicValue = isOpen ? searchQuery : (selectedOption ? selectedOption.label : "")

  return (
    <div className={cn("w-full relative font-sans", className)} ref={containerRef}>
      {label && (
        <label className="block text-sm font-semibold text-gray-850 mb-1.5 select-none">
          {label}
        </label>
      )}

      {/* Trigger: Ô tìm kiếm */}
      <div className="relative w-full">
        <input
          ref={inputRef}
          type="text"
          readOnly={disabled || !searchable}
          value={dynamicValue}
          onChange={(e) => {
            if (!isOpen) setIsOpen(true)
            setSearchQuery(e.target.value)
          }}
          onFocus={() => {
            if (!disabled) setIsOpen(true)
          }}
          placeholder={dynamicPlaceholder}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-xl border border-gray-200 bg-white pl-3 pr-10 py-2 text-sm text-gray-850 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors shadow-sm cursor-pointer",
            isOpen && "ring-2 ring-primary-500 ring-offset-2 border-primary-500",
            error && "border-danger-500 focus:ring-danger-500",
            disabled && "bg-gray-50 text-gray-400 cursor-not-allowed opacity-50",
            triggerClassName
          )}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center shrink-0 select-none">
          {clearable && selectedOption && !disabled ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              title="Xóa lựa chọn"
            >
              <X size={14} />
            </button>
          ) : (
            <ChevronDown size={16} className="text-gray-400 pointer-events-none" />
          )}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "absolute",
              top: `${dropdownCoords.top}px`,
              left: `${dropdownCoords.left}px`,
              width: `${dropdownCoords.width}px`,
              zIndex: 99999,
            }}
            className="z-99999 rounded-xl border border-primary-500 bg-white shadow-2xl overflow-hidden font-sans"
          >
            {/* Options List */}
            <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
              {/* options reset mặc định */}
              {clearable && (
                <div
                  onClick={() => handleSelect("", false)}
                  className={cn(
                    "flex items-center justify-between px-2.5 py-2 text-sm text-gray-850 cursor-pointer rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors",
                    value === "" && "bg-gray-200 font-semibold"
                  )}
                >
                  <span className="truncate">{placeholder}</span>
                  {value === "" && <Check size={14} className="text-primary-600 shrink-0 ml-2" />}
                </div>
              )}
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => {
                  const optValStr = String(opt?.value ?? "")
                  const isSelected = optValStr === String(value ?? "")
                  return (
                    <div
                      key={optValStr}
                      onClick={() => handleSelect(optValStr, opt.disabled)}
                      className={cn(
                        "flex items-center justify-between px-2.5 py-2 text-sm text-gray-750 cursor-pointer rounded-lg hover:bg-gray-200 hover:text-gray-800 transition-colors",
                        isSelected && "bg-gray-200 text-primary-500 font-semibold",
                        opt.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-gray-400"
                      )}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isSelected && <Check size={14} className="text-primary-600 shrink-0 ml-2" />}
                    </div>
                  )
                })
              ) : (
                <div className="px-3 py-6 text-sm text-gray-400 text-center select-none">
                  Không tìm thấy kết quả
                </div>
              )}
            </div>
          </div>,
          document.body
        )}

      {error && <p className="mt-1 text-xs text-danger-500 select-none">{error}</p>}
    </div>
  )
}

export default Combobox
