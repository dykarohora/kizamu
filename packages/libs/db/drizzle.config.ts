import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: 'drizzle',
  dialect: 'postgresql',
  schema: './src/**/*.sql.ts',
  dbCredentials: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT) ?? 5432,
    database: process.env.DB_DATABASE ?? 'postgres',
    user: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    ssl: process.env.NODE_ENV === 'local' ? false : 'require',
  },
})
