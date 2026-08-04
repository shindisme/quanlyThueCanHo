import { useState, useRef, useEffect } from "react"
import { Check, ChevronDown, X } from "lucide-react"
import { cn } from "../../lib/utils"
import { removeVietnameseTones } from "../../utils/string"

export interface ComboboxOption {
  value: string
  label: string
  disabled?: boolean
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
  const inputRef = useRef<HTMLInputElement>(null)

  //Đóng dropdown khi click ra ngoài
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

  //Reset ô tìm kiếm khi đóng dropdown
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("")
    }
  }, [isOpen])

  const selectedOption = options.find((opt) => String(opt.value) === String(value))

  const handleSelect = (val: string, disabledOption?: boolean) => {
    if (disabledOption) return
    onChange(val)
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange("")
    setSearchQuery("")
  }

  const filteredOptions = options.filter((opt) => {
    const term = removeVietnameseTones(searchQuery.toLowerCase())
    const labelNorm = removeVietnameseTones(opt.label.toLowerCase())
    return labelNorm.includes(term)
  })

  // Nhãn hiển thị tạm thời khi đang tìm kiếm
  const dynamicPlaceholder = isOpen && selectedOption ? selectedOption.label : placeholder

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

      {/* Dropdown Overlay */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-primary-500 bg-white shadow-xl shadow-gray-100/70 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Ô tìm kiếm */}
          {searchable && options.length > 5 && (
            <div className="p-2 border-b border-gray-100 bg-gray-50/50">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder || "Tìm kiếm..."}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
                  autoFocus
                />
                <ChevronDown size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 rotate-180" />
              </div>
            </div>
          )}
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
                const isSelected = String(opt.value) === String(value)
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt.value, opt.disabled)}
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
        </div>
      )}

      {error && <p className="mt-1 text-xs text-danger-500 select-none">{error}</p>}
    </div>
  )
}

export default Combobox
