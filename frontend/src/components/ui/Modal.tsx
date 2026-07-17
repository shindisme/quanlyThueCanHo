import * as React from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"

type ModalSize = "sm" | "md" | "lg" | "xl"

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: ModalSize
  footer?: React.ReactNode
  closeOnOutsideClick?: boolean
}

const sizeStyles: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  footer,
  closeOnOutsideClick = true,
}: ModalProps) {
  React.useEffect(() => {
    if (isOpen) {
      const count = Number(document.body.dataset.modalCount || "0") + 1;
      document.body.dataset.modalCount = String(count);
      if (count === 1) document.body.style.overflow = "hidden";
    }
    return () => {
      if (isOpen) {
        const count = Math.max(0, Number(document.body.dataset.modalCount || "1") - 1);
        document.body.dataset.modalCount = String(count);
        if (count === 0) document.body.style.overflow = "";
      }
    };
  }, [isOpen])

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && closeOnOutsideClick) onClose()
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
    }
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose, closeOnOutsideClick])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 animate-fade-in"
        onClick={closeOnOutsideClick ? onClose : undefined}
      />

      {/* Modal Content */}
      <div
        className={cn(
          "relative w-full bg-white rounded-xl shadow-2xl animate-scale-in max-h-[90vh] flex flex-col overflow-hidden border border-gray-200",
          sizeStyles[size]
        )}
      >
        {/* Close Button */}
        {closeOnOutsideClick && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer z-10"
          >
            <X size={20} />
          </button>
        )}

        {/* Header */}
        {title && (
          <div className="border-b border-gray-100 px-6 py-5">
            <h3 className="text-lg font-bold text-gray-900 leading-none pr-8">{title}</h3>
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 md:p-8">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-4 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

