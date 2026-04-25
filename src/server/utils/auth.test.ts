import { describe, it, expect, vi } from 'vitest'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

import { assertAuthenticated } from './auth'
import { auth } from '@/auth'

const mockedAuth = auth as unknown as ReturnType<typeof vi.fn>

describe('assertAuthenticated', () => {
  it('returns userId when session is valid', async () => {
    mockedAuth.mockResolvedValue({
      user: { id: 'user-123' },
      expires: '',
    })
    const result = await assertAuthenticated()
    expect(result).toBe('user-123')
  })

  it('throws "unauthenticated" when session is null', async () => {
    mockedAuth.mockResolvedValue(null as any)
    await expect(assertAuthenticated()).rejects.toThrow('unauthenticated')
  })

  it('throws "unauthenticated" when session has no user', async () => {
    mockedAuth.mockResolvedValue({ user: undefined, expires: '' } as any)
    await expect(assertAuthenticated()).rejects.toThrow('unauthenticated')
  })

  it('throws "unauthenticated" when user has no id', async () => {
    mockedAuth.mockResolvedValue({
      user: { id: undefined },
      expires: '',
    } as any)
    await expect(assertAuthenticated()).rejects.toThrow('unauthenticated')
  })

  it('throws "unauthenticated" when user id is empty string', async () => {
    mockedAuth.mockResolvedValue({
      user: { id: '' },
      expires: '',
    } as any)
    await expect(assertAuthenticated()).rejects.toThrow('unauthenticated')
  })
})
