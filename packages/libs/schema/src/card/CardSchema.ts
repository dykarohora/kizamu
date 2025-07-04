import { Schema } from 'effect'
import { UserInfoSchema } from '../user'

/**
 * カード集約のスキーマ定義
 * カードは独立した集約ルートとして扱う
 */
export const CardSchema = Schema.Struct({
  id: Schema.NonEmptyString,
  deckId: Schema.NonEmptyString,
  createdBy: UserInfoSchema,
  frontContent: Schema.NonEmptyString,
  backContent: Schema.NonEmptyString,
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
})

/**
 * カード集約の型定義
 */
export type Card = Schema.Schema.Type<typeof CardSchema>
