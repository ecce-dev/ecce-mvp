import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Adds target="_blank" and rel="noopener noreferrer" to all anchor tags in HTML string
 * This ensures all links open in a new tab for better UX
 */
export function addTargetBlankToLinks(html: string): string {
  if (!html) return html
  return html.replace(/<a /g, '<a target="_blank" rel="noopener noreferrer" ')
}
