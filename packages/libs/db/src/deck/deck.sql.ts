import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { usersTable } from '../user/user.sql'

export const decksTable = pgTable(
  'decks',
  {
    id: text('id').primaryKey(),
    createdBy: text('created_by')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    name: text('name').notNull(),
    description: text('description').notNull().default(''),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('decks_created_by_idx').on(table.createdBy)],
)
