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
 * @param date {} - Date object
 * @returns number - Days until the date
 */
export function calculateDaysUntil(date: Date) {
  const today = new Date()
  return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}
