import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { usersTable } from '../user/user.sql'

/**
 * フラッシュカードのデッキを管理するテーブル
 *
 * インデックス:
 * - user_id: ユーザーごとのデッキ一覧取得を効率化するために設定
 *   - ユーザーがログインした際に自分のデッキ一覧を表示する機能が頻繁に使用されるため
 *   - WHERE user_id = ? のクエリのパフォーマンスを向上させる
 */
export const decksTable = pgTable(
  'decks',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    name: text('name').notNull(),
    description: text('description').notNull().default(''),
    createdAt: timestamp('created_at')
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp('updated_at')
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index('decks_user_id_idx').on(table.userId)],
)
