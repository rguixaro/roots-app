import { NextResponse } from 'next/server'
import sharp from 'sharp'

import { auth } from '@/auth'
import { env } from '@/env.mjs'

export const runtime = 'nodejs'

const ALLOWED_WIDTHS = [64, 96, 128, 256, 384, 768, 1200] as const
const DEFAULT_QUALITY = 75

function clampQuality(value: string | null) {
  const parsed = value ? Number.parseInt(value, 10) : DEFAULT_QUALITY
  if (!Number.isFinite(parsed)) return DEFAULT_QUALITY
  return Math.min(96, Math.max(40, parsed))
}

function normalizeWidth(value: string | null) {
  if (!value) return null

  const requested = Number.parseInt(value, 10)
  if (!Number.isFinite(requested) || requested <= 0) return null

  return ALLOWED_WIDTHS.find((width) => width >= requested) ?? ALLOWED_WIDTHS.at(-1)!
}

function shouldTransform(contentType: string) {
  const normalized = contentType.toLowerCase()
  return normalized.startsWith('image/') && !normalized.includes('svg') && !normalized.includes('gif')
}

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!env.IMAGES_ENABLED || !env.NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN) {
      return NextResponse.json({ error: 'Image fetching is disabled' }, { status: 404 })
    }

    const allowedHost = new URL(env.NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN).host

    const { searchParams } = new URL(req.url)
    const url = searchParams.get('url')
    if (!url) return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
    const width = normalizeWidth(searchParams.get('w'))
    const quality = clampQuality(searchParams.get('q'))

    const targetUrl = new URL(url)
    if (targetUrl.host !== allowedHost) {
      return NextResponse.json({ error: 'Invalid url host' }, { status: 400 })
    }

    const response = await fetch(targetUrl.toString(), {
      headers: { cookie: req.headers.get('cookie') || '' },
    })

    if (!response.ok)
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: response.status })

    const arrayBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const source = Buffer.from(arrayBuffer)

    if (!width || !shouldTransform(contentType)) {
      return new Response(source, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'private, max-age=3600',
        },
      })
    }

    const acceptsWebp = req.headers.get('accept')?.includes('image/webp') ?? false
    const transformer = sharp(source, { failOn: 'none' })
      .rotate()
      .resize({ width, withoutEnlargement: true })

    const optimized = acceptsWebp
      ? await transformer.webp({ quality }).toBuffer()
      : await transformer.jpeg({ quality, mozjpeg: true }).toBuffer()

    return new Response(optimized, {
      headers: {
        'Content-Type': acceptsWebp ? 'image/webp' : 'image/jpeg',
        'Cache-Control': 'private, max-age=86400',
        Vary: 'Accept',
      },
    })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
