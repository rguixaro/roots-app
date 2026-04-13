const MAX_DIMENSION = 2048
const MAX_BLOB_SIZE = 800 * 1024
const JPEG_QUALITY_START = 0.85
const JPEG_QUALITY_MIN = 0.5
const JPEG_QUALITY_STEP = 0.05

/**
 * Compress an image client-side using Canvas.
 * Mirrors the server-side sharp pipeline (2048x2048, JPEG) and
 * guarantees the output stays under MAX_BLOB_SIZE by progressively
 * reducing quality if needed. Keeps uploads under the AWS
 * Lambda@Edge 1 MB body limit (Amplify hosting).
 */
export function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => {
      URL.revokeObjectURL(img.src)

      let { width, height } = img
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas not supported'))
        return
      }
      ctx.drawImage(img, 0, 0, width, height)

      const tryCompress = (quality: number) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Compression failed'))
              return
            }
            if (blob.size > MAX_BLOB_SIZE && quality - JPEG_QUALITY_STEP >= JPEG_QUALITY_MIN) {
              tryCompress(quality - JPEG_QUALITY_STEP)
              return
            }
            resolve(
              new File([blob], file.name?.replace(/\.[^.]+$/, '.jpg') || 'image.jpg', {
                type: 'image/jpeg',
              })
            )
          },
          'image/jpeg',
          quality
        )
      }

      tryCompress(JPEG_QUALITY_START)
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}
