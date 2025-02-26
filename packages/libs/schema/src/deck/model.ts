import { Schema } from 'effect'

/**
 * デッキのスキーマ定義
 */
export const DeckSchema = Schema.Struct({
  id: Schema.NonEmptyString,
  name: Schema.NonEmptyString,
  description: Schema.NonEmptyString,
  createdAt: Schema.DateFromSelf,
  updatedAt: Schema.DateFromSelf,
})

/**
 * デッキの型
 */
export type Deck = Schema.Schema.Type<typeof DeckSchema>
