import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useId,
} from "react"
import type { ReactNode, ComponentPropsWithoutRef } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"

// Global Modal Stack for Top-most ESC key handling & Body Scroll Lock
type CloseCallback = () => void
const escModalStack: CloseCallback[] = []

function handleGlobalKeyDown(e: KeyboardEvent) {
  if (e.key === "Escape" && escModalStack.length > 0) {
    const topClose = escModalStack[escModalStack.length - 1]
    topClose()
  }
}

let escListenerAttached = false
function registerEscCallback(onClose: CloseCallback) {
  escModalStack.push(onClose)
  if (!escListenerAttached) {
    document.addEventListener("keydown", handleGlobalKeyDown)
    escListenerAttached = true
  }
  return () => {
    const idx = escModalStack.indexOf(onClose)
    if (idx !== -1) {
      escModalStack.splice(idx, 1)
    }
    if (escModalStack.length === 0 && escListenerAttached) {
      document.removeEventListener("keydown", handleGlobalKeyDown)
      escListenerAttached = false
    }
  }
}

function lockBodyScroll() {
  const count = Number(document.body.dataset.modalCount || "0") + 1
  document.body.dataset.modalCount = String(count)

  if (count === 1) {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    const currentPadding = parseFloat(window.getComputedStyle(document.body).paddingRight || "0")
    document.body.dataset.originalPaddingRight = document.body.style.paddingRight || ""
    document.body.dataset.originalOverflow = document.body.style.overflow || ""

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${currentPadding + scrollbarWidth}px`
    }
    document.body.style.overflow = "hidden"
  }
}

function unlockBodyScroll() {
  const count = Math.max(0, Number(document.body.dataset.modalCount || "1") - 1)
  document.body.dataset.modalCount = String(count)

  if (count === 0) {
    document.body.style.paddingRight = document.body.dataset.originalPaddingRight || ""
    document.body.style.overflow = document.body.dataset.originalOverflow || ""
    delete document.body.dataset.originalPaddingRight
    delete document.body.dataset.originalOverflow
  }
}

// Dialog Context
interface DialogContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  titleId: string
  descriptionId: string
}

const DialogContext = createContext<DialogContextValue | null>(null)

function useDialog() {
  const context = useContext(DialogContext)
  if (!context) {
    throw new Error("Dialog components must be rendered within <Dialog />")
  }
  return context
}

export interface DialogProps {
  children: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function Dialog({ children, open: externalOpen, onOpenChange }: DialogProps) {
  const [localOpen, setLocalOpen] = useState(false)
  const isControlled = externalOpen !== undefined
  const open = isControlled ? externalOpen : localOpen

  const titleId = useId()
  const descriptionId = useId()

  const setOpen = useCallback(
    (newOpen: boolean) => {
      if (!isControlled) {
        setLocalOpen(newOpen)
      }
      onOpenChange?.(newOpen)
    },
    [isControlled, onOpenChange]
  )

  return (
    <DialogContext.Provider value={{ open, setOpen, titleId, descriptionId }}>
      {children}
    </DialogContext.Provider>
  )
}

// DialogTrigger
export interface DialogTriggerProps extends ComponentPropsWithoutRef<"button"> {
  asChild?: boolean
}

export const DialogTrigger = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ className, children, onClick, asChild = false, ...props }, ref) => {
    const { open, setOpen } = useDialog()

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e)
      if (!e.defaultPrevented) {
        setOpen(!open)
      }
    }

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{
        onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
        ref?: React.Ref<HTMLButtonElement>
      }>
      return React.cloneElement(child, {
        ref,
        onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
          child.props.onClick?.(e)
          handleClick(e)
        },
        ...props,
      })
    }

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        className={cn("cursor-pointer focus:outline-none", className)}
        {...props}
      >
        {children}
      </button>
    )
  }
)
DialogTrigger.displayName = "DialogTrigger"

// DialogOverlay
export type DialogOverlayProps = ComponentPropsWithoutRef<"div">

export const DialogOverlay = React.forwardRef<HTMLDivElement, DialogOverlayProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in transition-opacity",
          className
        )}
        {...props}
      />
    )
  }
)
DialogOverlay.displayName = "DialogOverlay"

// DialogContent
export interface DialogContentProps extends ComponentPropsWithoutRef<"div"> {
  size?: "sm" | "md" | "lg" | "xl"
  hideCloseButton?: boolean
}

const sizeStyles = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
}

export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  (
    {
      className,
      children,
      size = "md",
      hideCloseButton = false,
      onPointerDown,
      onClick,
      ...props
    },
    ref
  ) => {
    const { open, setOpen, titleId, descriptionId } = useDialog()
    const [isClosing, setIsClosing] = useState(false)
    const [shouldRender, setShouldRender] = useState(open)

    const contentRef = useRef<HTMLDivElement | null>(null)
    const previousFocusRef = useRef<HTMLElement | null>(null)
    const pointerDownOnOverlayRef = useRef<boolean>(false)

    // Merge refs
    const setRefs = useCallback(
      (node: HTMLDivElement | null) => {
        contentRef.current = node
        if (typeof ref === "function") {
          ref(node)
        } else if (ref) {
          ; (ref as React.MutableRefObject<HTMLDivElement | null>).current = node
        }
      },
      [ref]
    )

    // Handle smooth mounting/unmounting transitions
    useEffect(() => {
      if (open) {
        setShouldRender(true)
        setIsClosing(false)
      } else if (shouldRender) {
        setIsClosing(true)
        const timer = setTimeout(() => {
          setShouldRender(false)
          setIsClosing(false)
        }, 150) // Match animation duration
        return () => clearTimeout(timer)
      }
    }, [open, shouldRender])

    // Body scroll lock & Focus management
    useEffect(() => {
      if (!shouldRender) return

      // Save previously focused element
      previousFocusRef.current = document.activeElement as HTMLElement | null

      // Lock scrollbar
      lockBodyScroll()

      // Register ESC callback stack
      const unregisterEsc = registerEscCallback(() => setOpen(false))

      // Focus first focusable element in dialog
      const timer = setTimeout(() => {
        if (contentRef.current) {
          const focusables = contentRef.current.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
          if (focusables.length > 0) {
            focusables[0].focus()
          } else {
            contentRef.current.focus()
          }
        }
      }, 50)

      return () => {
        clearTimeout(timer)
        unlockBodyScroll()
        unregisterEsc()

        // Restore focus to original trigger element
        if (previousFocusRef.current && typeof previousFocusRef.current.focus === "function") {
          previousFocusRef.current.focus()
        }
      }
    }, [shouldRender, setOpen])

    // Keyboard Focus Trap
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      props.onKeyDown?.(e)
      if (e.key !== "Tab" || !contentRef.current) return

      const focusables = Array.from(
        contentRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      )

      if (focusables.length === 0) {
        e.preventDefault()
        return
      }

      const firstElement = focusables[0]
      const lastElement = focusables[focusables.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === firstElement || document.activeElement === contentRef.current) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    // PointerDown tracking on backdrop to prevent closing when dragging mouse outside
    const handleOverlayPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      pointerDownOnOverlayRef.current = e.target === e.currentTarget
      onPointerDown?.(e)
    }

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
      onClick?.(e)
      if (pointerDownOnOverlayRef.current && e.target === e.currentTarget) {
        setOpen(false)
      }
      pointerDownOnOverlayRef.current = false
    }

    if (!shouldRender) return null

    return createPortal(
      <div
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center p-4 font-sans transition-all duration-150",
          isClosing ? "opacity-0 scale-95" : "opacity-100 scale-100"
        )}
        onPointerDown={handleOverlayPointerDown}
        onClick={handleOverlayClick}
      >
        <DialogOverlay />

        <div
          ref={setRefs}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          className={cn(
            "relative w-full bg-white rounded-xl shadow-2xl animate-scale-in max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 focus:outline-none z-10",
            sizeStyles[size],
            className
          )}
          {...props}
        >
          {!hideCloseButton && (
            <DialogClose className="absolute right-4 top-4 p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer z-10">
              <X size={20} />
              <span className="sr-only">Đóng</span>
            </DialogClose>
          )}

          <div className="overflow-y-auto p-6 md:p-8 flex-1">{children}</div>
        </div>
      </div>,
      document.body
    )
  }
)
DialogContent.displayName = "DialogContent"

// DialogHeader
export type DialogHeaderProps = ComponentPropsWithoutRef<"div">

export const DialogHeader = React.forwardRef<HTMLDivElement, DialogHeaderProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 text-center sm:text-left mb-4", className)}
        {...props}
      />
    )
  }
)
DialogHeader.displayName = "DialogHeader"

// DialogFooter 
export type DialogFooterProps = ComponentPropsWithoutRef<"div">

export const DialogFooter = React.forwardRef<HTMLDivElement, DialogFooterProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6 gap-2", className)}
        {...props}
      />
    )
  }
)
DialogFooter.displayName = "DialogFooter"

// DialogTitle
export type DialogTitleProps = ComponentPropsWithoutRef<"h2">

export const DialogTitle = React.forwardRef<HTMLHeadingElement, DialogTitleProps>(
  ({ className, id, ...props }, ref) => {
    const { titleId } = useDialog()
    return (
      <h2
        ref={ref}
        id={id || titleId}
        className={cn("text-lg font-bold text-gray-900 leading-none", className)}
        {...props}
      />
    )
  }
)
DialogTitle.displayName = "DialogTitle"

// DialogDescription 
export type DialogDescriptionProps = ComponentPropsWithoutRef<"p">

export const DialogDescription = React.forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  ({ className, id, ...props }, ref) => {
    const { descriptionId } = useDialog()
    return (
      <p
        ref={ref}
        id={id || descriptionId}
        className={cn("text-sm text-gray-500 mt-1", className)}
        {...props}
      />
    )
  }
)
DialogDescription.displayName = "DialogDescription"

// DialogClose
export interface DialogCloseProps extends ComponentPropsWithoutRef<"button"> {
  asChild?: boolean
}

export const DialogClose = React.forwardRef<HTMLButtonElement, DialogCloseProps>(
  ({ className, children, onClick, asChild = false, ...props }, ref) => {
    const { setOpen } = useDialog()

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e)
      if (!e.defaultPrevented) {
        setOpen(false)
      }
    }

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{
        onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
        ref?: React.Ref<HTMLButtonElement>
      }>
      return React.cloneElement(child, {
        ref,
        onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
          child.props.onClick?.(e)
          handleClick(e)
        },
        ...props,
      })
    }

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        className={cn("cursor-pointer focus:outline-none", className)}
        {...props}
      >
        {children}
      </button>
    )
  }
)
DialogClose.displayName = "DialogClose"




