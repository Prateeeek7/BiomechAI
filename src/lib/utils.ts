import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(value: number, decimals: number = 1): string {
  return value.toFixed(decimals)
}

export function getStatusColor(value: number, type: 'good' | 'warning' | 'error'): string {
  switch (type) {
    case 'good':
      return value > 80 ? 'text-success-light' : value > 60 ? 'text-warning-light' : 'text-error-light'
    case 'warning':
      return value < 10 ? 'text-success-light' : value < 20 ? 'text-warning-light' : 'text-error-light'
    case 'error':
      return value < 5 ? 'text-success-light' : value < 10 ? 'text-warning-light' : 'text-error-light'
    default:
      return 'text-secondary-light'
  }
}

export function getPostureColor(value: number, type: string): string {
  switch (type) {
    case 'forwardHead':
      return value < 15 ? 'text-success-light' : value < 25 ? 'text-warning-light' : 'text-error-light'
    case 'shoulderTilt':
      return value < 5 ? 'text-success-light' : value < 10 ? 'text-warning-light' : 'text-error-light'
    case 'spineAlignment':
      return value < 5 ? 'text-success-light' : value < 10 ? 'text-warning-light' : 'text-error-light'
    case 'headTilt':
      return value < 5 ? 'text-success-light' : value < 10 ? 'text-warning-light' : 'text-error-light'
    default:
      return 'text-secondary-light'
  }
}

export function getGaitColor(value: number, type: string): string {
  switch (type) {
    case 'symmetry':
      return value > 80 ? 'text-success-light' : value > 60 ? 'text-warning-light' : 'text-error-light'
    case 'balance':
      return Math.abs(value - 50) < 10 ? 'text-success-light' : Math.abs(value - 50) < 20 ? 'text-warning-light' : 'text-error-light'
    case 'cadence':
      return value > 100 && value < 120 ? 'text-success-light' : value > 80 && value < 140 ? 'text-warning-light' : 'text-error-light'
    default:
      return 'text-secondary-light'
  }
}