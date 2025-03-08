import { Schema } from 'effect'

/**
 * ユーザーのスキーマ定義（バリデータ）
 */
export const UserSchema = Schema.Struct({
  id: Schema.NonEmptyString,
  name: Schema.NonEmptyString,
  email: Schema.NonEmptyString,
})

/**
 * ユーザーの型
 */
export type User = Schema.Schema.Type<typeof UserSchema>
