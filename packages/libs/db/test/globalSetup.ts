import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

import { config } from '@dotenvx/dotenvx'
config({ path: './packages/libs/db/.env.test.local' })
config({ path: '.env.test.local' })

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const migrationClient = postgres({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT) ?? 5432,
  database: process.env.DB_DATABASE ?? 'postgres',
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  ssl: 'require',
  max: 1,
})

export const setup = async () => {
  await migrate(drizzle(migrationClient), { migrationsFolder: resolve(__dirname, '../drizzle') })
  await migrationClient.end()
}
