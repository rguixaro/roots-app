import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3'
import sharp from 'sharp'
import { Readable } from 'stream'
import * as dotenv from 'dotenv'

dotenv.config()

const AMAZON_REGION = process.env.AMAZON_REGION
const AMAZON_S3_BUCKET_NAME = process.env.AMAZON_S3_BUCKET_NAME

const s3 = new S3Client({ region: AMAZON_REGION })

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

async function compressImage(buffer: Buffer): Promise<Buffer> {
  return await sharp(buffer)
    .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .withMetadata()
    .toBuffer()
    .catch((_) => buffer)
}

async function compressAndUploadImages(prefix: string = 'roots/images/') {
  let continuationToken: string | undefined = undefined
  let totalProcessed = 0
  let totalCompressed = 0
  let totalUploaded = 0
  let totalFailed = 0
  let totalOriginalSize = 0
  let totalCompressedSize = 0

  console.log(`Starting compression for prefix: ${prefix}`)
  console.log(`Bucket: ${AMAZON_S3_BUCKET_NAME}\n`)

  do {
    const listCommand: ListObjectsV2Command = new ListObjectsV2Command({
      Bucket: AMAZON_S3_BUCKET_NAME,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    })

    const listResponse = await s3.send(listCommand)
    const objects = listResponse.Contents || []

    console.log(`Found ${objects.length} objects in this batch\n`)

    for (const object of objects) {
      if (!object.Key) continue

      const fileKey = object.Key

      if (
        !fileKey.toLowerCase().endsWith('.jpg') &&
        !fileKey.toLowerCase().endsWith('.jpeg') &&
        !fileKey.toLowerCase().endsWith('.png') &&
        !fileKey.toLowerCase().endsWith('.webp')
      ) {
        continue
      }

      totalProcessed++

      try {
        console.log(`[${totalProcessed}] Processing: ${fileKey}`)

        const getCommand: GetObjectCommand = new GetObjectCommand({
          Bucket: AMAZON_S3_BUCKET_NAME,
          Key: fileKey,
        })

        const getResponse = await s3.send(getCommand)
        if (!getResponse.Body) {
          console.error(`No body in response for ${fileKey}`)
          totalFailed++
          continue
        }

        const buffer = await streamToBuffer(getResponse.Body as Readable)
        const originalSize = buffer.length
        totalOriginalSize += originalSize

        const compressedBuffer = await compressImage(buffer)
        const compressedSize = compressedBuffer.length
        totalCompressedSize += compressedSize

        await s3.send(
          new PutObjectCommand({
            Bucket: AMAZON_S3_BUCKET_NAME,
            Key: fileKey,
            Body: compressedBuffer,
            ContentType: 'image/jpeg',
          })
        )

        totalUploaded++

        const sizeBefore = (originalSize / 1024).toFixed(2)
        const sizeAfter = (compressedSize / 1024).toFixed(2)
        const savings = (((originalSize - compressedSize) / originalSize) * 100).toFixed(1)

        if (compressedSize < originalSize) {
          totalCompressed++
          console.log(
            `[${totalProcessed}] ✓ Compressed & Uploaded: ${fileKey} (${sizeBefore}KB -> ${sizeAfter}KB, saved ${savings}%)`
          )
        } else {
          console.log(
            `[${totalProcessed}] ✓ Uploaded (no compression): ${fileKey} (${sizeBefore}KB)`
          )
        }
      } catch (error) {
        console.error(`[${totalProcessed}] ✗ Failed to process ${fileKey}:`, error)
        totalFailed++
      }
    }

    continuationToken = listResponse.NextContinuationToken
  } while (continuationToken)

  const totalOriginalMB = (totalOriginalSize / 1024 / 1024).toFixed(2)
  const totalCompressedMB = (totalCompressedSize / 1024 / 1024).toFixed(2)
  const totalSavings = (
    ((totalOriginalSize - totalCompressedSize) / totalOriginalSize) *
    100
  ).toFixed(1)

  console.log('\n--- Compression & Upload Summary ---')
  console.log(`Total files processed: ${totalProcessed}`)
  console.log(`Successfully uploaded: ${totalUploaded}`)
  console.log(`Files compressed: ${totalCompressed}`)
  console.log(`Failed: ${totalFailed}`)
  console.log(`Total original size: ${totalOriginalMB}MB`)
  console.log(`Total compressed size: ${totalCompressedMB}MB`)
  console.log(`Total savings: ${totalSavings}%`)
}

compressAndUploadImages('roots/images/')
  .then(() => {
    console.log('\nCompression complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
