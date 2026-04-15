import { NextResponse } from 'next/server'

import { auth } from '@/auth'
import { env } from '@/env.mjs'

const CLOUDFRONT_COOKIES = ['CloudFront-Key-Pair-Id', 'CloudFront-Policy', 'CloudFront-Signature']

export async function POST() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const response = NextResponse.json({ success: true })

  for (const name of CLOUDFRONT_COOKIES) {
    response.cookies.set({
      name,
      value: '',
      path: '/',
      maxAge: 0,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      domain: env.COOKIES_DOMAIN,
    })
  }

  return response
}
