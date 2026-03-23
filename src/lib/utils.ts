import { clsx } from 'clsx'
import type { ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const compactFormatter = new Intl.NumberFormat('en', { notation: 'compact' })

export function formatCompact(value: number): string {
  return compactFormatter.format(value)
}
