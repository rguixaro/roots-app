import { NextResponse } from 'next/server'
import { getSignedCookies } from '@aws-sdk/cloudfront-signer'
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'

import { env } from '@/env.mjs'

const { AMAZON_CLOUDFRONT_KEY_PAIR_ID, NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN } = env

const secrets = new SecretsManagerClient({ region: env.AMAZON_REGION })

async function getPrivateKey() {
  const response = await secrets.send(
    new GetSecretValueCommand({
      SecretId: env.AMAZON_CLOUDFRONT_PRIVATE_KEY_SECRET_NAME,
    })
  )
  return response.SecretString!
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const returnTo = url.searchParams.get('return') || '/'

  const privateKey = await getPrivateKey()

  const expires = Math.floor(Date.now() / 1000) + 60 * 60 * 6

  const urlPath = new URL(NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN)
  const resourcePath = `${urlPath.pathname}/*`
  const policy = {
    Statement: [
      {
        Resource: resourcePath,
        Condition: { DateLessThan: { 'AWS:EpochTime': expires } },
      },
    ],
  }

  const cookies = getSignedCookies({
    privateKey,
    keyPairId: AMAZON_CLOUDFRONT_KEY_PAIR_ID,
    policy: JSON.stringify(policy),
  })

  const redirectUrl = new URL(returnTo, req.url)
  const response = NextResponse.redirect(redirectUrl)

  Object.entries(cookies).forEach(([name, value]) => {
    response.cookies.set({
      name,
      value,
      path: '/',
      httpOnly: false,
      secure: true,
      sameSite: 'none',
      domain: '.rguixaro.dev',
      maxAge: 60 * 60 * 6,
    })
  })

  return response
}
