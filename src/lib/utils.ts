import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculate productivity score based on active and inactive seconds
 * Implements the same logic as the SQL function calculate_productivity_score
 * 
 * @param activeSeconds - Total active time in seconds
 * @param inactiveSeconds - Total inactive time in seconds
 * @returns Productivity score (minimum 0, rounded to 2 decimal places)
 */
export function calculateProductivityScore(activeSeconds: number, inactiveSeconds: number): number {
  // Calculate points based on hours
  // +1 point for every 3600 seconds (1 hour) of active time
  const activePoints = activeSeconds / 3600.0
  
  // -1 point for every 3600 seconds (1 hour) of inactive time
  const inactivePoints = inactiveSeconds / 3600.0
  
  // Final score = active points - inactive points
  let productivityScore = activePoints - inactivePoints
  
  // Ensure score is not negative (minimum 0)
  if (productivityScore < 0) {
    productivityScore = 0.00
  }
  
  // Round to 2 decimal places
  return Math.round(productivityScore * 100) / 100
}

/**
 * Format time duration from seconds to hours and minutes
 * 
 * @param seconds - Time duration in seconds
 * @returns Formatted string like "2h 30m" or "45m"
 */
export function formatTimeDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}

/**
 * Calculate active percentage from active and inactive seconds
 * 
 * @param activeSeconds - Total active time in seconds
 * @param inactiveSeconds - Total inactive time in seconds
 * @returns Active percentage (0-100, rounded to 2 decimal places)
 */
export function calculateActivePercentage(activeSeconds: number, inactiveSeconds: number): number {
  const totalSeconds = activeSeconds + inactiveSeconds
  
  if (totalSeconds === 0) {
    return 0.00
  }
  
  const percentage = (activeSeconds / totalSeconds) * 100
  return Math.round(percentage * 100) / 100
}