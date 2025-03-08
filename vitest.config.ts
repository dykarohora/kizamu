import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    workspace: ['packages/apps/*/vitest.config.{js,ts}', 'packages/libs/*/vitest.config.{js,ts}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/*.d.ts'],
    },
  },
})
