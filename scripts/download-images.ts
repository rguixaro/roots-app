import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3'
import { Readable } from 'stream'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

dotenv.config()

const AMAZON_REGION = process.env.AMAZON_REGION
const AMAZON_S3_BUCKET_NAME = process.env.AMAZON_S3_BUCKET_NAME
const OUTPUT_DIR = './downloaded-images'

const s3 = new S3Client({ region: AMAZON_REGION })

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

async function downloadAllImages(prefix: string = '') {
  let continuationToken: string | undefined = undefined
  let totalDownloaded = 0
  let totalFailed = 0
  let totalSize = 0

  console.log(`Starting download for prefix: ${prefix} and bucket: ${AMAZON_S3_BUCKET_NAME}`)
  console.log(`Output directory: ${OUTPUT_DIR}`)

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  do {
    const listCommand: ListObjectsV2Command = new ListObjectsV2Command({
      Bucket: AMAZON_S3_BUCKET_NAME,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    })

    const listResponse = await s3.send(listCommand)
    const objects = listResponse.Contents || []

    console.log(`Found ${objects.length} objects in this batch`)

    for (const object of objects) {
      if (!object.Key) continue

      const fileKey = object.Key

      if (
        !fileKey.toLowerCase().endsWith('.jpg') &&
        !fileKey.toLowerCase().endsWith('.jpeg') &&
        !fileKey.toLowerCase().endsWith('.png') &&
        !fileKey.toLowerCase().endsWith('.webp')
      ) {
        console.log(`Skipping non-image file: ${fileKey}`)
        continue
      }

      try {
        console.log(`[${totalDownloaded + 1}] Downloading: ${fileKey}`)

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
        const fileSize = buffer.length

        const localPath = path.join(OUTPUT_DIR, fileKey)
        const localDir = path.dirname(localPath)

        if (!fs.existsSync(localDir)) {
          fs.mkdirSync(localDir, { recursive: true })
        }

        fs.writeFileSync(localPath, buffer)

        totalDownloaded++
        totalSize += fileSize
        const sizeMB = (fileSize / 1024 / 1024).toFixed(2)

        console.log(`[${totalDownloaded}] ✓ Downloaded: ${fileKey} (${sizeMB}MB) -> ${localPath}`)
      } catch (error) {
        console.error(`✗ Failed to download ${fileKey}:`, error)
        totalFailed++
      }
    }

    continuationToken = listResponse.NextContinuationToken
  } while (continuationToken)

  console.log('\n--- Download Summary ---')
  console.log(`Total files downloaded: ${totalDownloaded}`)
  console.log(`Total size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`)
  console.log(`Failed: ${totalFailed}`)
  console.log(`Files saved to: ${path.resolve(OUTPUT_DIR)}`)
}

downloadAllImages('roots/images/')
  .then(() => {
    console.log('Download complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
