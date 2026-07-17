import { createContext, useContext, useState, useRef, useCallback, useEffect } from "react"
import type { RefObject, ReactNode, ComponentProps } from "react"
import { cn } from "../../lib/utils"

interface DropdownMenuContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: RefObject<HTMLButtonElement | null>
  contentRef: RefObject<HTMLDivElement | null>
}

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null)

function useDropdownMenu() {
  const context = useContext(DropdownMenuContext)
  if (!context) {
    throw new Error("DropdownMenu components must be rendered within a <DropdownMenu />")
  }
  return context
}

interface DropdownMenuProps {
  children: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function DropdownMenu({ children, open: externalOpen, onOpenChange }: DropdownMenuProps) {
  const [localOpen, setLocalOpen] = useState(false)
  const isControlled = externalOpen !== undefined
  const open = isControlled ? externalOpen : localOpen

  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)

  const setOpen = useCallback(
    (newOpen: boolean) => {
      if (!isControlled) {
        setLocalOpen(newOpen)
      }
      onOpenChange?.(newOpen)
    },
    [isControlled, onOpenChange]
  )

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        contentRef.current &&
        !contentRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open, setOpen])

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen, triggerRef, contentRef }}>
      <div className="relative inline-block text-left">{children}</div>
    </DropdownMenuContext.Provider>
  )
}

type DropdownMenuTriggerProps = ComponentProps<"button">

function DropdownMenuTrigger({ className, children, ref, ...props }: DropdownMenuTriggerProps) {
  const { open, setOpen, triggerRef } = useDropdownMenu()

  const handleRef = (node: HTMLButtonElement | null) => {
    triggerRef.current = node
    if (typeof ref === "function") ref(node)
    else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node
  }

  return (
    <button
      ref={handleRef}
      type="button"
      onClick={() => setOpen(!open)}
      className={cn("cursor-pointer focus:outline-none", className)}
      {...props}
    >
      {children}
    </button>
  )
}

function DropdownMenuContent({ className, children, ref, ...props }: ComponentProps<"div">) {
  const { open, contentRef } = useDropdownMenu()
  if (!open) return null

  const handleRef = (node: HTMLDivElement | null) => {
    contentRef.current = node
    if (typeof ref === "function") ref(node)
    else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node
  }

  return (
    <div
      ref={handleRef}
      className={cn(
        "absolute right-0 mt-2 z-50 min-w-32 overflow-hidden rounded-md border border-gray-200 bg-white p-1 text-gray-700 shadow-md animate-scale-in focus:outline-none",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function DropdownMenuItem({ className, disabled, ref, ...props }: ComponentProps<"div"> & { disabled?: boolean }) {
  const { setOpen } = useDropdownMenu()

  return (
    <div
      ref={ref}
      onClick={(e) => {
        if (disabled) return
        props.onClick?.(e)
        setOpen(false)
      }}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 data-disabled:pointer-events-none data-disabled:opacity-50",
        disabled && "pointer-events-none opacity-50 cursor-not-allowed",
        className
      )}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
}
