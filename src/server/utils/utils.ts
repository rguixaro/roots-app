/**
 * Slugifies a string.
 * @param str string
 * @returns string
 */
export function slugify(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Returns the number of days until the given date.
 * @param date {Date} - The target date
 * @param options {Object} - Configuration options
 * @param options.ignoreYear {boolean} - If true, calculates days until the next occurrence of this date (ignoring year)
 * @returns number - Days until the date
 */
export function calculateDaysUntil(date: Date, options?: { ignoreYear?: boolean }) {
  const today = new Date()

  if (options?.ignoreYear) {
    const targetDate = new Date(today.getFullYear(), date.getMonth(), date.getDate())

    if (targetDate < today) {
      targetDate.setFullYear(today.getFullYear() + 1)
    }

    return Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Checks if a date falls in the current week, ignoring the year
 * @param date {Date} - The date to check
 * @returns boolean - True if the date is in the current week (any year)
 */
export function isInCurrentWeekOfYear(date: Date): boolean {
  const today = new Date()
  const targetDate = new Date(today.getFullYear(), date.getMonth(), date.getDate())

  const currentWeekStart = new Date(today)
  currentWeekStart.setDate(today.getDate() - today.getDay())
  currentWeekStart.setHours(0, 0, 0, 0)

  const currentWeekEnd = new Date(currentWeekStart)
  currentWeekEnd.setDate(currentWeekStart.getDate() + 6)
  currentWeekEnd.setHours(23, 59, 59, 999)

  console.log({ targetDate, currentWeekStart, currentWeekEnd })
  return targetDate >= currentWeekStart && targetDate <= currentWeekEnd
}
