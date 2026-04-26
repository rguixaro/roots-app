import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'

import { env } from '@/env.mjs'

let secrets: SecretsManagerClient | null = null

/**
 * Get private key from AWS Secrets Manager
 * @returns {Promise<string>} Private key
 */
export async function getPrivateKey(): Promise<string> {
  if (!env.AMAZON_REGION) {
    throw new Error('AMAZON_REGION is required for image cookies')
  }
  if (!env.AMAZON_CLOUDFRONT_PRIVATE_KEY_SECRET_NAME) {
    throw new Error('AMAZON_CLOUDFRONT_PRIVATE_KEY_SECRET_NAME is required for image cookies')
  }

  secrets ??= new SecretsManagerClient({ region: env.AMAZON_REGION })

  const response = await secrets.send(
    new GetSecretValueCommand({
      SecretId: env.AMAZON_CLOUDFRONT_PRIVATE_KEY_SECRET_NAME,
    })
  )
  if (!response.SecretString) {
    throw new Error('CloudFront private key secret not found or stored as binary')
  }
  return response.SecretString
}
