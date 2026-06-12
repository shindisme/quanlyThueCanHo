import { cn } from "../../../lib/utils";
import type { ReactNode } from "react";

// Card bao boc noi dung voi shadow mem va bo goc lon
interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}

export default function Card({ children, className, padding = true }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl shadow-card",
        padding && "p-5",
        className
      )}
    >
      {children}
    </div>
  );
}
