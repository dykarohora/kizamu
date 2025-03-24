import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const usersTable = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
