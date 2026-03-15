import { NextResponse } from 'next/server'

import { auth } from '@/auth'

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allowedHost = new URL(process.env.NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN!).host

    const { searchParams } = new URL(req.url)
    const url = searchParams.get('url')
    if (!url) return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })

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

    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
