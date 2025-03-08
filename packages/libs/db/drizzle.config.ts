import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'drizzle-kit'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  out: resolve(__dirname, 'drizzle'),
  dialect: 'postgresql',
  schema: resolve(__dirname, './src/**/*.sql.ts'),
})
