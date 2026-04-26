export const publicImagesEnabled = process.env.NEXT_PUBLIC_IMAGES_ENABLED !== 'false'

const assetsDomain = process.env.NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN

export function getImageAssetUrl(fileKey?: string | null) {
  if (!publicImagesEnabled || !assetsDomain || !fileKey) return null

  return `${assetsDomain.replace(/\/$/, '')}/${fileKey.replace(/^\//, '')}`
}
