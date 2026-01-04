import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'

import { env } from '@/env.mjs'

const secrets = new SecretsManagerClient({ region: env.AMAZON_REGION })

/**
 * Get private key from AWS Secrets Manager
 * @returns {Promise<string>} Private key
 */
export async function getPrivateKey(): Promise<string> {
  const response = await secrets.send(
    new GetSecretValueCommand({
      SecretId: env.AMAZON_CLOUDFRONT_PRIVATE_KEY_SECRET_NAME,
    })
  )
  return response.SecretString!
}
