import { NextResponse } from 'next/server'

import { setCloudFrontCookies } from '@/lib/cloudfront'

/**
 * Refresh CloudFront cookies without redirect
 * Returns JSON response with success status
 */
export async function POST() {
  try {
    const response = NextResponse.json({ success: true })
    await setCloudFrontCookies(response)

    return response
  } catch (_) {
    return NextResponse.json(
      { success: false, error: 'Failed to refresh cookies' },
      { status: 500 }
    )
  }
}
