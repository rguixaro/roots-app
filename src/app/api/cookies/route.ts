import { NextResponse } from 'next/server'
import { getSignedCookies } from '@aws-sdk/cloudfront-signer'
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'

import { env } from '@/env.mjs'

const { AWS_CLOUDFRONT_KEY_PAIR_ID, NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN } = env

const secrets = new SecretsManagerClient({ region: env.AWS_REGION })

async function getPrivateKey() {
  const response = await secrets.send(
    new GetSecretValueCommand({
      SecretId: env.AWS_CLOUDFRONT_PRIVATE_KEY_SECRET_NAME,
    })
  )
  return response.SecretString!
}

export async function GET() {
  const privateKey = await getPrivateKey()

  const expires = Math.floor(Date.now() / 1000) + 60 * 60 * 6

  const policy = {
    Statement: [
      {
        Resource: `${NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN}/*`,
        Condition: {
          DateLessThan: { 'AWS:EpochTime': expires },
        },
      },
    ],
  }

  const cookies = getSignedCookies({
    privateKey,
    keyPairId: AWS_CLOUDFRONT_KEY_PAIR_ID,
    policy: JSON.stringify(policy),
  })

  const response = NextResponse.json({ success: true })

  Object.entries(cookies).forEach(([name, value]) => {
    response.cookies.set({
      name,
      value,
      path: '/',
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 6,
    })
  })

  return response
}
