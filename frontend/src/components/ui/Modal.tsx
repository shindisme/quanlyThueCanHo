import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useId,
} from "react"
import type { ComponentPropsWithoutRef, ReactNode } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"

type ModalSize = "sm" | "md" | "lg" | "xl"

export interface ModalProps extends Omit<ComponentPropsWithoutRef<"div">, "title"> {
  isOpen: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  size?: ModalSize
  footer?: ReactNode
  closeOnOutsideClick?: boolean
}

const sizeStyles: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
}

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

export const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      isOpen,
      onClose,
      title,
      children,
      size = "md",
      footer,
      closeOnOutsideClick = true,
      className,
      onPointerDown,
      onClick,
      ...props
    },
    ref
  ) => {
    const [isClosing, setIsClosing] = useState(false)
    const [shouldRender, setShouldRender] = useState(isOpen)

    const titleId = useId()
    const contentRef = useRef<HTMLDivElement | null>(null)
    const previousFocusRef = useRef<HTMLElement | null>(null)
    const pointerDownOnOverlayRef = useRef<boolean>(false)
    const onCloseRef = useRef(onClose)

    useEffect(() => {
      onCloseRef.current = onClose
    }, [onClose])

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

    // Mounting / Unmounting animation
    useEffect(() => {
      if (isOpen) {
        setShouldRender(true)
        setIsClosing(false)
      } else if (shouldRender) {
        setIsClosing(true)
        const timer = setTimeout(() => {
          setShouldRender(false)
          setIsClosing(false)
        }, 150)
        return () => clearTimeout(timer)
      }
    }, [isOpen, shouldRender])

    // Body scroll lock, focus restoration, ESC stack
    useEffect(() => {
      if (!shouldRender) return

      previousFocusRef.current = document.activeElement as HTMLElement | null
      lockBodyScroll()

      const unregisterEsc = registerEscCallback(() => {
        if (closeOnOutsideClick) {
          onCloseRef.current()
        }
      })

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

        if (previousFocusRef.current && typeof previousFocusRef.current.focus === "function") {
          previousFocusRef.current.focus()
        }
      }
    }, [shouldRender, closeOnOutsideClick])

    // Focus Trap
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

    const handleOverlayPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      pointerDownOnOverlayRef.current = e.target === e.currentTarget
      onPointerDown?.(e)
    }

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
      onClick?.(e)
      if (
        closeOnOutsideClick &&
        pointerDownOnOverlayRef.current &&
        e.target === e.currentTarget
      ) {
        onCloseRef.current()
        }
      pointerDownOnOverlayRef.current = false
    }

    if (!shouldRender) return null

    return createPortal(
      <div
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center p-2 font-sans transition-all duration-150 sm:p-4",
          isClosing ? "opacity-0 scale-95" : "opacity-100 scale-100"
        )}
        onPointerDown={handleOverlayPointerDown}
        onClick={handleOverlayClick}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in transition-opacity" />


        {/* Modal Content */}
        <div
          ref={setRefs}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          className={cn(
            "relative z-10 flex max-h-[calc(100dvh-1rem)] w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl animate-scale-in focus:outline-none sm:max-h-[calc(100dvh-2rem)]",
            sizeStyles[size],
            className
          )}
          {...props}
        >
          {/* Close Button */}
          {closeOnOutsideClick && (
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer z-10"
            >
              <X size={20} />
              <span className="sr-only">Đóng</span>
            </button>
          )}

          {/* Header */}
          {title && (
            <div className="border-b border-gray-100 px-4 py-4 sm:px-6 sm:py-5">
              <h3 id={titleId} className="text-lg font-bold text-gray-900 leading-none pr-8">
                {title}
              </h3>
            </div>
          )}

          {/* Body */}
          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50/50 px-4 py-3 sm:flex-row sm:justify-end sm:gap-3 sm:px-6 sm:py-4 [&>button]:w-full sm:[&>button]:w-auto">
              {footer}
            </div>
          )}
        </div>
      </div>,
      document.body
    )
  }
)

Modal.displayName = "Modal"

export default Modal



