import { NextResponse } from 'next/server'

import { auth } from '@/auth'
import { collectTreeJsonExport } from '@/server/export/tree-export'

export const runtime = 'nodejs'

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params
  const result = await collectTreeJsonExport(slug, userId)

  if (result.error) {
    return NextResponse.json({ error: result.message }, { status: result.status })
  }

  return new Response(`${JSON.stringify(result.payload, null, 2)}\n`, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${result.filename}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
