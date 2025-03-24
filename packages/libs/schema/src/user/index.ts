import { Schema } from 'effect'

/**
 * ユーザーのスキーマ定義（バリデータ）
 * 基本的なユーザー情報を表現します
 */
export const UserSchema = Schema.Struct({
  id: Schema.NonEmptyString,
  name: Schema.NonEmptyString,
})

/**
 * ユーザーの型
 */
export type User = Schema.Schema.Type<typeof UserSchema>

/**
 * ユーザー情報の簡易表示形式
 * 現時点ではUserSchemaと同じ構造のため、エイリアスとして定義
 * APIレスポンスなどで使用される軽量なユーザー情報を表します
 */
export const UserInfoSchema = UserSchema

/**
 * ユーザー情報の簡易表示形式の型
 */
export type UserInfo = User
