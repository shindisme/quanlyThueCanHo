import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from "react"
import type { ReactNode, ComponentPropsWithoutRef } from "react"
import { cn } from "../../lib/utils"

interface DropdownMenuContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
  contentRef: React.RefObject<HTMLDivElement | null>
}

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null)

function useDropdownMenu() {
  const context = useContext(DropdownMenuContext)
  if (!context) {
    throw new Error("DropdownMenu components must be rendered within a <DropdownMenu />")
  }
  return context
}


export interface DropdownMenuProps {
  children: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function DropdownMenu({ children, open: externalOpen, onOpenChange }: DropdownMenuProps) {
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
    if (!open) return
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

export type DropdownMenuTriggerProps = ComponentPropsWithoutRef<"button">

export const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  ({ className, children, onClick, ...props }, ref) => {
    const { open, setOpen, triggerRef } = useDropdownMenu()

    const setRefs = useCallback(
      (node: HTMLButtonElement | null) => {
        ;(triggerRef as React.MutableRefObject<HTMLButtonElement | null>).current = node
        if (typeof ref === "function") {
          ref(node)
        } else if (ref) {
          ;(ref as React.MutableRefObject<HTMLButtonElement | null>).current = node
        }
      },
      [ref, triggerRef]
    )

    return (
      <button
        ref={setRefs}
        type="button"
        onClick={(e) => {
          onClick?.(e)
          if (!e.defaultPrevented) {
            setOpen(!open)
          }
        }}
        className={cn("cursor-pointer focus:outline-none", className)}
        {...props}
      >
        {children}
      </button>
    )
  }
)
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

export type DropdownMenuContentProps = ComponentPropsWithoutRef<"div">

export const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ className, children, ...props }, ref) => {
    const { open, contentRef } = useDropdownMenu()

    const setRefs = useCallback(
      (node: HTMLDivElement | null) => {
        ;(contentRef as React.MutableRefObject<HTMLDivElement | null>).current = node
        if (typeof ref === "function") {
          ref(node)
        } else if (ref) {
          ;(ref as React.MutableRefObject<HTMLDivElement | null>).current = node
        }
      },
      [ref, contentRef]
    )

    if (!open) return null

    return (
      <div
        ref={setRefs}
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
)
DropdownMenuContent.displayName = "DropdownMenuContent"

export interface DropdownMenuItemProps extends ComponentPropsWithoutRef<"div"> {
  disabled?: boolean
}

export const DropdownMenuItem = React.forwardRef<HTMLDivElement, DropdownMenuItemProps>(
  ({ className, disabled, onClick, ...props }, ref) => {
    const { setOpen } = useDropdownMenu()

    return (
      <div
        ref={ref}
        onClick={(e) => {
          if (disabled) return
          onClick?.(e)
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
)
DropdownMenuItem.displayName = "DropdownMenuItem"



