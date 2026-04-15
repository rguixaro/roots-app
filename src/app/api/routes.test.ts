import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'
import { NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/server/db', () => ({
  db: { $runCommandRaw: vi.fn() },
}))

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/env.mjs', () => ({
  env: {
    CRON_SECRET: 'test-secret-32-chars-minimum-len',
    NODE_ENV: 'test',
    COOKIES_DOMAIN: '.example.com',
    NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN: 'https://assets.example.com',
  },
}))

vi.mock('@/lib/cloudfront', () => ({
  setCloudFrontCookies: vi.fn(),
}))

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}))

vi.mock('@/server/actions/newsletter', () => ({
  sendWeeklyNewsletters: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { GET as healthGET } from './health/route'
import { POST as logoutPOST } from './logout/route'
import { POST as cookiesRefreshPOST } from './cookies/refresh/route'
import { POST as cronNewsletterPOST } from './cron/weekly-newsletter/route'
import { GET as proxyGET } from './proxy/route'

import { db } from '@/server/db'
import { auth } from '@/auth'
import { setCloudFrontCookies } from '@/lib/cloudfront'
import * as Sentry from '@sentry/nextjs'
import { sendWeeklyNewsletters } from '@/server/actions/newsletter'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockAuth = auth as Mock
const mockDbPing = db.$runCommandRaw as Mock
const mockSetCFCookies = setCloudFrontCookies as Mock
const mockSendNewsletters = sendWeeklyNewsletters as Mock

function authenticatedSession() {
  return { user: { id: 'user-1', name: 'Test', email: 'test@example.com' } }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // -------------------------------------------------------------------------
  // /api/health
  // -------------------------------------------------------------------------
  describe('GET /api/health', () => {
    it('returns 200 with status ok when DB ping succeeds', async () => {
      mockDbPing.mockResolvedValue({ ok: 1 })
      process.env.NEXT_PUBLIC_APP_VERSION = '1.0.0'

      const res = await healthGET()
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.status).toBe('ok')
      expect(body.db).toBe('ok')
    })

    it('returns 503 with status degraded when DB ping fails', async () => {
      mockDbPing.mockRejectedValue(new Error('connection refused'))

      const res = await healthGET()
      const body = await res.json()

      expect(res.status).toBe(503)
      expect(body.status).toBe('degraded')
      expect(body.db).toBe('error')
    })

    it('includes version from env', async () => {
      mockDbPing.mockResolvedValue({ ok: 1 })
      process.env.NEXT_PUBLIC_APP_VERSION = '2.5.0'

      const res = await healthGET()
      const body = await res.json()

      expect(body.version).toBe('2.5.0')
    })

    it('includes a timestamp', async () => {
      mockDbPing.mockResolvedValue({ ok: 1 })

      const res = await healthGET()
      const body = await res.json()

      expect(body.timestamp).toBeDefined()
      expect(() => new Date(body.timestamp)).not.toThrow()
    })
  })

  // -------------------------------------------------------------------------
  // /api/logout
  // -------------------------------------------------------------------------
  describe('POST /api/logout', () => {
    it('returns 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null)

      const res = await logoutPOST()
      const body = await res.json()

      expect(res.status).toBe(401)
      expect(body.error).toBe('Unauthorized')
    })

    it('clears CloudFront cookies on success', async () => {
      mockAuth.mockResolvedValue(authenticatedSession())

      const res = await logoutPOST()
      const setCookies = res.headers.getSetCookie()

      const cookieNames = ['CloudFront-Key-Pair-Id', 'CloudFront-Policy', 'CloudFront-Signature']
      for (const name of cookieNames) {
        const cookie = setCookies.find((c: string) => c.includes(name))
        expect(cookie).toBeDefined()
        expect(cookie).toContain('Max-Age=0')
      }
    })

    it('returns success JSON', async () => {
      mockAuth.mockResolvedValue(authenticatedSession())

      const res = await logoutPOST()
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  // /api/cookies/refresh
  // -------------------------------------------------------------------------
  describe('POST /api/cookies/refresh', () => {
    it('returns 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null)

      const res = await cookiesRefreshPOST()
      const body = await res.json()

      expect(res.status).toBe(401)
      expect(body.success).toBe(false)
      expect(body.error).toBe('Unauthorized')
    })

    it('returns 200 and calls setCloudFrontCookies on success', async () => {
      mockAuth.mockResolvedValue(authenticatedSession())
      mockSetCFCookies.mockResolvedValue({ expires: 1234567890 })

      const res = await cookiesRefreshPOST()
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
      expect(mockSetCFCookies).toHaveBeenCalledOnce()
    })

    it('returns 500 on error and calls Sentry', async () => {
      mockAuth.mockResolvedValue(authenticatedSession())
      mockSetCFCookies.mockRejectedValue(new Error('signing failed'))

      const res = await cookiesRefreshPOST()
      const body = await res.json()

      expect(res.status).toBe(500)
      expect(body.success).toBe(false)
      expect(body.error).toBe('Failed to refresh cookies')
      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({ tags: { action: 'refreshCookies' } })
      )
    })
  })

  // -------------------------------------------------------------------------
  // /api/cron/weekly-newsletter
  // -------------------------------------------------------------------------
  describe('POST /api/cron/weekly-newsletter', () => {
    function cronRequest(secret?: string) {
      const headers: Record<string, string> = {}
      if (secret) headers['x-cron-secret'] = secret
      return new NextRequest('http://localhost/api/cron/weekly-newsletter', {
        method: 'POST',
        headers,
      })
    }

    it('returns 401 when secret is missing', async () => {
      const res = await cronNewsletterPOST(cronRequest())
      const body = await res.json()

      expect(res.status).toBe(401)
      expect(body.error).toBe('Unauthorized')
    })

    it('returns 401 when secret is wrong', async () => {
      const res = await cronNewsletterPOST(cronRequest('wrong-secret'))
      const body = await res.json()

      expect(res.status).toBe(401)
      expect(body.error).toBe('Unauthorized')
    })

    it('returns 200 with newsletter results on valid secret', async () => {
      mockSendNewsletters.mockResolvedValue({
        success: true,
        emailsSent: 5,
        errors: 0,
      })

      const res = await cronNewsletterPOST(
        cronRequest('test-secret-32-chars-minimum-len')
      )
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
      expect(body.emailsSent).toBe(5)
      expect(body.errors).toBe(0)
    })

    it('returns 500 on error and calls Sentry', async () => {
      mockSendNewsletters.mockRejectedValue(new Error('smtp down'))

      const res = await cronNewsletterPOST(
        cronRequest('test-secret-32-chars-minimum-len')
      )
      const body = await res.json()

      expect(res.status).toBe(500)
      expect(body.success).toBe(false)
      expect(body.error).toBe('Failed to send newsletters')
      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({ tags: { action: 'weeklyNewsletterCron' } })
      )
    })
  })

  // -------------------------------------------------------------------------
  // /api/proxy
  // -------------------------------------------------------------------------
  describe('GET /api/proxy', () => {
    const originalFetch = globalThis.fetch

    beforeEach(() => {
      mockAuth.mockResolvedValue(authenticatedSession())
      process.env.NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN = 'https://assets.example.com'
    })

    afterEach(() => {
      globalThis.fetch = originalFetch
    })

    it('returns 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null)

      const req = new Request('http://localhost/api/proxy?url=https://assets.example.com/img.jpg')
      const res = await proxyGET(req)
      const body = await res.json()

      expect(res.status).toBe(401)
      expect(body.error).toBe('Unauthorized')
    })

    it('returns 400 when url param is missing', async () => {
      const req = new Request('http://localhost/api/proxy')
      const res = await proxyGET(req)
      const body = await res.json()

      expect(res.status).toBe(400)
      expect(body.error).toBe('Missing url parameter')
    })

    it('returns 400 when host does not match allowed host', async () => {
      const req = new Request('http://localhost/api/proxy?url=https://evil.com/img.jpg')
      const res = await proxyGET(req)
      const body = await res.json()

      expect(res.status).toBe(400)
      expect(body.error).toBe('Invalid url host')
    })

    it('returns image data on success', async () => {
      const imageBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47])
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(imageBytes, {
          status: 200,
          headers: { 'content-type': 'image/png' },
        })
      )

      const req = new Request('http://localhost/api/proxy?url=https://assets.example.com/photo.png')
      const res = await proxyGET(req)

      expect(res.status).toBe(200)
      expect(res.headers.get('Content-Type')).toBe('image/png')
      expect(res.headers.get('Cache-Control')).toBe('private, max-age=3600')

      const buffer = await res.arrayBuffer()
      expect(new Uint8Array(buffer)).toEqual(imageBytes)
    })
  })
})
