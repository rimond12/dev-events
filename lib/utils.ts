import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines multiple class names using clsx and merges Tailwind CSS classes intelligently.
 * Useful for conditional styling and avoiding Tailwind class conflicts.
 * @param inputs - Class values to combine (strings, objects, arrays, etc.)
 * @returns Merged class name string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
