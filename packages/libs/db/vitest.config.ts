import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'db',
    root: __dirname,
    environment: 'node',
    include: ['**/*.test.ts'],
    globalSetup: './test/globalSetup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/*.d.ts'],
    },
    pool: 'threads',
    poolOptions: {
      threads: { singleThread: true },
    },
  },
})
