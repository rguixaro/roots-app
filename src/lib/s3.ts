import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { randomUUID } from 'crypto'
import exifr from 'exifr'
import sharp from 'sharp'

import { env } from '@/env.mjs'

import { PictureMetadata } from '@/types'

const { AMAZON_REGION, AMAZON_S3_BUCKET_NAME } = env

const s3 = new S3Client({ region: AMAZON_REGION })

/**
 * Uploads a file to S3
 * @param file {File} - The file to upload
 * @param treeId {string} - The tree id
 * @returns Promise<[string, Date, PictureMetadata]> - The file key, the date the picture was taken, and the picture's metadata
 */
export async function uploadFileToS3(
  file: File,
  treeId: string
): Promise<[string, Date, PictureMetadata]> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const exif = await exifr.parse(buffer)

  const compressedBuffer = await sharp(buffer)
    .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .withMetadata()
    .toBuffer()
    .catch((_) => buffer)

  const takenAt = exif?.DateTimeOriginal ?? exif?.CreateDate

  const metadata: PictureMetadata = {
    takenAt,
    width: exif?.ExifImageWidth ?? undefined,
    height: exif?.ExifImageHeight ?? undefined,
    orientation: exif?.Orientation ?? undefined,
    camera: exif?.Make || exif?.Model ? { make: exif?.Make, model: exif?.Model } : undefined,
    gps:
      typeof exif?.latitude === 'number' && typeof exif?.longitude === 'number'
        ? {
            lat: exif.latitude,
            lng: exif.longitude,
            altitude: exif.altitude ?? undefined,
          }
        : undefined,
    source: {
      hasExif: !!exif,
      exifDates: {
        original: exif?.DateTimeOriginal,
        created: exif?.CreateDate,
        modified: exif?.ModifyDate,
      },
    },
  }

  const date = takenAt ?? (file.lastModified ? new Date(file.lastModified) : new Date())

  const uniqueId = randomUUID()
  const fileKey = `images/tree_${treeId}/${uniqueId}.jpg`

  await s3.send(
    new PutObjectCommand({
      Bucket: AMAZON_S3_BUCKET_NAME,
      Key: `roots/${fileKey}`,
      Body: compressedBuffer,
      ContentType: 'image/jpeg',
    })
  )

  return [fileKey, date, metadata]
}

/**
 * Delete a file from S3
 * @param fileKey {string} - The file key to delete
 */
export async function deleteFileFromS3(fileKey: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: AMAZON_S3_BUCKET_NAME,
      Key: fileKey,
    })
  )
}
