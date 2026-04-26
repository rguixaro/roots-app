import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'
import { randomUUID } from 'crypto'
import exifr from 'exifr'
import * as Sentry from '@sentry/nextjs'
import sharp from 'sharp'

import { env } from '@/env.mjs'

import { PictureMetadata } from '@/types'

const { AMAZON_S3_BUCKET_NAME } = env

let s3: S3Client | null = null

const S3_KEY_PREFIX = 'roots/'

export const toS3Key = (fileKey: string) => `${S3_KEY_PREFIX}${fileKey}`

function getImageStorageConfig() {
  if (!env.IMAGES_ENABLED) throw new Error('Image support is disabled')
  if (!env.AMAZON_REGION) throw new Error('AMAZON_REGION is required for image storage')
  if (!AMAZON_S3_BUCKET_NAME) throw new Error('AMAZON_S3_BUCKET_NAME is required for image storage')

  s3 ??= new S3Client({ region: env.AMAZON_REGION })

  return { bucket: AMAZON_S3_BUCKET_NAME, client: s3 }
}

function getImageDeleteConfig() {
  if (!env.IMAGES_ENABLED || !AMAZON_S3_BUCKET_NAME) return null
  if (!env.AMAZON_REGION) return null

  s3 ??= new S3Client({ region: env.AMAZON_REGION })

  return { bucket: AMAZON_S3_BUCKET_NAME, client: s3 }
}

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
  const { bucket, client } = getImageStorageConfig()
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const exif = await exifr.parse(buffer).catch(() => null)

  const compressedBuffer = await sharp(buffer)
    .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .withMetadata()
    .toBuffer()
    .catch((err) => {
      Sentry.captureException(err, {
        level: 'warning',
        tags: { action: 'uploadFileToS3', step: 'sharp-compress' },
      })
      return buffer
    })

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

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: toS3Key(fileKey),
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
  const config = getImageDeleteConfig()
  if (!config) return

  await config.client.send(
    new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: toS3Key(fileKey),
    })
  )
}

export async function getFileFromS3(fileKey: string) {
  const { bucket, client } = getImageStorageConfig()

  return client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: toS3Key(fileKey),
    })
  )
}

export async function getFileInfoFromS3(fileKey: string) {
  const { bucket, client } = getImageStorageConfig()

  return client.send(
    new HeadObjectCommand({
      Bucket: bucket,
      Key: toS3Key(fileKey),
    })
  )
}
