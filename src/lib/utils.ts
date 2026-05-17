import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Single source of truth + production validation lives in lib/env.
export { appUrl } from "@/lib/env";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
