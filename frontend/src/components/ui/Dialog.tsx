import { createContext, useContext, useState, useCallback, useEffect } from "react"
import type { ReactNode, ComponentProps } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"

interface DialogContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const DialogContext = createContext<DialogContextValue | null>(null)

function useDialog() {
  const context = useContext(DialogContext)
  if (!context) {
    throw new Error("Dialog components must be rendered within <Dialog />")
  }
  return context
}

interface DialogProps {
  children: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function Dialog({ children, open: externalOpen, onOpenChange }: DialogProps) {
  const [localOpen, setLocalOpen] = useState(false)
  const isControlled = externalOpen !== undefined
  const open = isControlled ? externalOpen : localOpen

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
    if (open) {
      const count = Number(document.body.dataset.modalCount || "0") + 1;
      document.body.dataset.modalCount = String(count);
      if (count === 1) document.body.style.overflow = "hidden";
    }
    return () => {
      if (open) {
        const count = Math.max(0, Number(document.body.dataset.modalCount || "1") - 1);
        document.body.dataset.modalCount = String(count);
        if (count === 0) document.body.style.overflow = "";
      }
    };
  }, [open])

  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  )
}

type DialogTriggerProps = ComponentProps<"button">

function DialogTrigger({ className, children, ref, ...props }: DialogTriggerProps) {
  const { open, setOpen } = useDialog()
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => setOpen(!open)}
      className={cn("cursor-pointer focus:outline-none", className)}
      {...props}
    >
      {children}
    </button>
  )
}

interface DialogContentProps extends ComponentProps<"div"> {
  size?: "sm" | "md" | "lg" | "xl"
}

const sizeStyles = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
}

function DialogContent({ className, children, size = "md", ref, ...props }: DialogContentProps) {
  const { open, setOpen } = useDialog()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    if (open) {
      document.addEventListener("keydown", handleKeyDown)
    }
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, setOpen])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
      <div
        className="absolute inset-0 bg-black/40 animate-fade-in"
        onClick={() => setOpen(false)}
      />
      
      <div
        ref={ref}
        className={cn(
          "relative w-full bg-white rounded-xl shadow-2xl animate-scale-in max-h-[90vh] flex flex-col overflow-hidden border border-gray-200",
          sizeStyles[size],
          className
        )}
        {...props}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer z-10"
        >
          <X size={20} />
        </button>
        
        <div className="overflow-y-auto p-6 md:p-8 flex-1">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}

function DialogHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 text-center sm:text-left mb-4", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6 gap-2", className)}
      {...props}
    />
  )
}

function DialogTitle({ className, ref, ...props }: ComponentProps<"h2">) {
  return (
    <h2
      ref={ref}
      className={cn("text-lg font-bold text-gray-900 leading-none", className)}
      {...props}
    />
  )
}

function DialogDescription({ className, ref, ...props }: ComponentProps<"p">) {
  return (
    <p
      ref={ref}
      className={cn("text-sm text-gray-500 mt-1", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
