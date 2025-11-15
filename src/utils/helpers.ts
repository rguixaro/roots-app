/**
 * Utility function to validate email format
 * @param email {string}
 * @returns {boolean}
 */
export const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

/**
 * onKeyDown handler to prevent form submission on Enter key
 * @param event {React.KeyboardEvent<HTMLFormElement>}
 */
export const checkKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
  if (event.key === 'Enter') event.preventDefault()
}
