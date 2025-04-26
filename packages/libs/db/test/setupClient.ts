import { config } from '@dotenvx/dotenvx'
import { drizzle } from 'drizzle-orm/postgres-js'
import { Redacted } from 'effect'
import postgres from 'postgres'
import { makeDbDriver } from '../src/driver'
config({ path: './packages/libs/db/.env.local.test' })
config({ path: '.env.local.test' })

export const getSetupClient = () => {
  const client = postgres({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT) ?? 5432,
    database: process.env.DB_DATABASE ?? 'postgres',
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    ssl: false,
  })

  return drizzle(client)
}

export const getTestDriver = () =>
  makeDbDriver({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT) ?? 5432,
    database: process.env.DB_DATABASE ?? 'postgres',
    username: process.env.DB_USERNAME ?? 'postgres',
    password: Redacted.make(process.env.DB_PASSWORD ?? 'postgres'),
    ssl: false,
  })
