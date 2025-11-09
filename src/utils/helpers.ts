/**
 * Utility function to validate email format
 * @param email {string}
 * @returns {boolean}
 */
export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * onKeyDown handler to prevent form submission on Enter key
 * @param event
 */
export const checkKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
  if (event.key === 'Enter') event.preventDefault()
}
