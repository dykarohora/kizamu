import { Schema } from 'effect'
import { UserInfoSchema } from '../user'

/**
 * デッキのスキーマ定義
 */
export const DeckSchema = Schema.Struct({
  id: Schema.NonEmptyString,
  name: Schema.NonEmptyString,
  description: Schema.NonEmptyString,
  createdBy: UserInfoSchema,
  createdAt: Schema.DateFromSelf,
  updatedAt: Schema.DateFromSelf,
})

/**
 * デッキの型
 */
export type Deck = Schema.Schema.Type<typeof DeckSchema>
