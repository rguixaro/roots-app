import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { randomUUID } from 'crypto'

import { env } from '@/env.mjs'

const { AMAZON_REGION, AMAZON_S3_BUCKET_NAME } = env

const s3 = new S3Client({ region: AMAZON_REGION })

export async function uploadFileToS3(file: File, treeId: string): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const extension = file.name.split('.').pop() || 'jpg'
  const uniqueId = randomUUID()
  const fileKey = `roots/images/tree_${treeId}/${uniqueId}.${extension}`

  await s3.send(
    new PutObjectCommand({
      Bucket: AMAZON_S3_BUCKET_NAME,
      Key: fileKey,
      Body: buffer,
      ContentType: file.type,
    })
  )

  return fileKey
}

export async function deleteFileFromS3(fileKey: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: AMAZON_S3_BUCKET_NAME,
      Key: fileKey,
    })
  )
}
