import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'schema',
    root: __dirname,
    environment: 'node',
    include: ['**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/*.d.ts'],
    },
  },
})
