import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Gop va xu ly trung class Tailwind
// Vi du: cn("px-4 py-2", condition && "px-6") => "px-6 py-2"
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
