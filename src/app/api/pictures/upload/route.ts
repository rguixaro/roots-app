import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

import { env } from '@/env.mjs'

const { AWS_REGION, AWS_S3_BUCKET_NAME } = env

const s3 = new S3Client({ region: AWS_REGION })

export async function POST(req: Request) {
  try {
    const formData = await req.formData()

    const file = formData.get('file') as File | null
    const treeId = formData.get('treeId') as string | null

    if (!file || !treeId) {
      return NextResponse.json({ error: 'file and treeId are required' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const extension = file.name.split('.').pop() || 'jpg'
    const uniqueId = randomUUID()
    const fileKey = `images/tree_${treeId}/${uniqueId}.${extension}`

    await s3.send(
      new PutObjectCommand({
        Bucket: AWS_S3_BUCKET_NAME,
        Key: fileKey,
        Body: buffer,
        ContentType: file.type,
      })
    )

    return NextResponse.json({ fileKey })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed', details: `${error}` }, { status: 500 })
  }
}
