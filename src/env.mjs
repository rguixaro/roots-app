import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

/**
 * Environment variables schema
 */
export const env = createEnv({
  server: {
    /// Environment
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

    /// Database
    DATABASE_URL: z.string(),

    /// Auth
    AUTH_SECRET: z.string(),
    AUTH_URL: z.string().url().optional(),
    AUTH_TRUST_HOST: z.string().optional(),

    /// Cookies
    COOKIES_DOMAIN: z.string().optional(),

    /// Google OAuth
    GOOGLE_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),

    /// Sentry
    SENTRY_DSN: z.string().url().optional(),
    SENTRY_ORG: z.string().optional(),

    /// AWS
    AMAZON_REGION: z.string(),
    AMAZON_S3_BUCKET_NAME: z.string(),
    AMAZON_CLOUDFRONT_KEY_PAIR_ID: z.string(),
    AMAZON_CLOUDFRONT_PRIVATE_KEY_SECRET_NAME: z.string(),
    AMAZON_SES_FROM_EMAIL: z.string().email(),

    /// Public
    NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN: z.string().url(),
  },
  runtimeEnv: {
    /// Environment
    NODE_ENV: process.env.NODE_ENV,

    /// Database
    DATABASE_URL: process.env.DATABASE_URL,

    /// Auth
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_URL: process.env.AUTH_URL,
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,

    /// Cookies
    COOKIES_DOMAIN: process.env.COOKIES_DOMAIN,

    /// Google OAuth
    GOOGLE_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,

    /// Sentry
    SENTRY_DSN: process.env.SENTRY_DSN,
    SENTRY_ORG: process.env.SENTRY_ORG,

    /// AWS
    AMAZON_REGION: process.env.AMAZON_REGION,
    AMAZON_S3_BUCKET_NAME: process.env.AMAZON_S3_BUCKET_NAME,
    AMAZON_CLOUDFRONT_KEY_PAIR_ID: process.env.AMAZON_CLOUDFRONT_KEY_PAIR_ID,
    AMAZON_CLOUDFRONT_PRIVATE_KEY_SECRET_NAME:
      process.env.AMAZON_CLOUDFRONT_PRIVATE_KEY_SECRET_NAME,
    AMAZON_SES_FROM_EMAIL: process.env.AMAZON_SES_FROM_EMAIL,

    /// Public
    NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN: process.env.NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
})
