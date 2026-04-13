import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    exclude: ['e2e/**', 'node_modules/**'],
    setupFiles: ['./src/test/setup.ts'],
    env: {
      SKIP_ENV_VALIDATION: 'true',
    },
    typecheck: {
      tsconfig: './tsconfig.test.json',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.d.ts',
        'src/types/**',
        'src/env.mjs',
        'src/app/**/layout.tsx',
        'src/app/**/page.tsx',
        'src/app/**/template.tsx',
      ],
      thresholds: {
        statements: 20,
        branches: 12,
        functions: 12,
        lines: 20,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      auth: path.resolve(__dirname, './src/auth.config.ts'),
    },
  },
})
