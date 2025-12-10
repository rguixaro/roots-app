import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

/**
 * Environment variables schema
 */
export const env = createEnv({
  server: {
    // Environment
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

    // Database
    DATABASE_URL: z.string(),

    // Auth
    AUTH_SECRET: z.string(),
    AUTH_URL: z.string().url().optional(),
    AUTH_TRUST_HOST: z.string().optional(),

    // Google OAuth
    GOOGLE_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),

    // AWS
    AMAZON_REGION: z.string(),
    AMAZON_S3_BUCKET_NAME: z.string(),
    AMAZON_CLOUDFRONT_KEY_PAIR_ID: z.string(),
    AMAZON_CLOUDFRONT_PRIVATE_KEY_SECRET_NAME: z.string(),

    // Public
    NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN: z.string().url(),
  },
  runtimeEnv: {
    // Environment
    NODE_ENV: process.env.NODE_ENV,

    // Database
    DATABASE_URL: process.env.DATABASE_URL,

    // Auth
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_URL: process.env.AUTH_URL,
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,

    // Google OAuth
    GOOGLE_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,

    // AWS
    AMAZON_REGION: process.env.AMAZON_REGION,
    AMAZON_S3_BUCKET_NAME: process.env.AMAZON_S3_BUCKET_NAME,
    AMAZON_CLOUDFRONT_KEY_PAIR_ID: process.env.AMAZON_CLOUDFRONT_KEY_PAIR_ID,
    AMAZON_CLOUDFRONT_PRIVATE_KEY_SECRET_NAME:
      process.env.AMAZON_CLOUDFRONT_PRIVATE_KEY_SECRET_NAME,

    // Public
    NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN: process.env.NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
})
