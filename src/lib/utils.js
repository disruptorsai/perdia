/**
 * UTILITY FUNCTIONS
 * Common utilities for the Perdia application
 */

import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge Tailwind CSS classes with proper precedence
 * Used by shadcn/ui components
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
