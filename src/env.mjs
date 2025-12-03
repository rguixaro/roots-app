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

    // Google OAuth
    GOOGLE_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),

    // AWS
    AWS_REGION: z.string(),
    AWS_S3_BUCKET_NAME: z.string(),
    AWS_CLOUDFRONT_KEY_PAIR_ID: z.string(),
    AWS_CLOUDFRONT_PRIVATE_KEY_SECRET_NAME: z.string(),
    NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN: z.string().url(),
  },
  runtimeEnv: {
    // Environment
    NODE_ENV: process.env.NODE_ENV,

    // Database
    DATABASE_URL: process.env.DATABASE_URL,

    // Auth
    AUTH_SECRET: process.env.AUTH_SECRET,

    // Google OAuth
    GOOGLE_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,

    // AWS
    AWS_REGION: process.env.AWS_REGION,
    AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME,
    AWS_CLOUDFRONT_KEY_PAIR_ID: process.env.AWS_CLOUDFRONT_KEY_PAIR_ID,
    AWS_CLOUDFRONT_PRIVATE_KEY_SECRET_NAME: process.env.AWS_CLOUDFRONT_PRIVATE_KEY_SECRET_NAME,
    NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN: process.env.NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
})
