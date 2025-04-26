import { index, integer, pgTable, primaryKey, real, text, timestamp } from 'drizzle-orm/pg-core'
import { decksTable } from '../deck/deck.sql'
import { usersTable } from '../user/user.sql'

// カードテーブル定義
export const cardsTable = pgTable(
  'cards',
  {
    id: text('id').primaryKey(),
    deckId: text('deck_id')
      .notNull()
      .references(() => decksTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    frontContent: text('front_content').notNull(),
    backContent: text('back_content').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('cards_deck_id_idx').on(table.deckId)],
)

// 学習イベントテーブル定義
export const studyEventsTable = pgTable(
  'study_events',
  {
    id: text('id').primaryKey(),
    deckId: text('deck_id')
      .notNull()
      .references(() => decksTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    studiedBy: text('studied_by')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    cardId: text('card_id')
      .notNull()
      .references(() => cardsTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    grade: integer('grade').notNull(),
    studiedAt: timestamp('studied_at').notNull().defaultNow(),
  },
  (table) => [
    index('study_events_deck_id_idx').on(table.deckId),
    index('study_events_card_id_idx').on(table.cardId),
    index('study_events_studied_by_studied_at_idx').on(table.studiedBy, table.studiedAt),
  ],
)

// カード学習状態テーブル定義
export const cardLearningStatesTable = pgTable(
  'card_learning_states',
  {
    cardId: text('card_id')
      .notNull()
      .references(() => cardsTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    studiedBy: text('studied_by')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    easeFactor: real('ease_factor').notNull().default(2.5),
    interval: integer('interval').notNull().default(0),
    nextStudyDate: timestamp('next_study_date').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    // 複合主キーの設定
    primaryKey({ columns: [table.cardId, table.studiedBy] }),
    index('card_learning_states_studied_by_idx').on(table.studiedBy),
    index('card_learning_states_next_study_date_idx').on(table.nextStudyDate),
  ],
)
