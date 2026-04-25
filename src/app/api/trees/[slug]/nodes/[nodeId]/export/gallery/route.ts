import { NextResponse } from 'next/server'

import { auth } from '@/auth'
import { collectNodeGalleryExport } from '@/server/export/tree-export'

export const runtime = 'nodejs'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string; nodeId: string }> }
) {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug, nodeId } = await params
  const result = await collectNodeGalleryExport(slug, nodeId, userId)

  if (result.error) {
    return NextResponse.json({ error: result.message }, { status: result.status })
  }

  return new Response(result.stream, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${result.filename}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
