import { describe, expect, it } from 'vitest'

import { formatGreetingDate } from './greeting'

describe('formatGreetingDate', () => {
  it('only capitalizes the first character for Catalan dates', () => {
    const date = new Date(2026, 3, 26, 12)

    expect(formatGreetingDate(date, 'ca')).toBe('Diumenge, 26 d’abril')
  })
})
