import { NextRequest, NextResponse } from 'next/server'

import { env } from '@/env.mjs'

import { sendWeeklyNewsletters } from '@/server/actions/newsletter'

/**
 * API Route for triggering weekly newsletters
 * Should be called by a cron job service
 */
export async function POST(request: NextRequest) {
  try {
    const cronSecret = env.CRON_SECRET

    const hasValidSecret = request.headers.get('x-cron-secret') === cronSecret
    if (!hasValidSecret) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await sendWeeklyNewsletters()

    return NextResponse.json({
      success: result.success,
      message: `Newsletters sent successfully. Emails sent: ${result.emailsSent}, Errors: ${result.errors}`,
      emailsSent: result.emailsSent,
      errors: result.errors,
    })
  } catch (error) {
    console.error('Error in weekly newsletter cron job:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send newsletters' },
      { status: 500 }
    )
  }
}
