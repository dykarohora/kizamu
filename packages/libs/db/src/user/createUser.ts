import type { SqlError } from '@effect/sql'
import { PgDrizzle } from '@effect/sql-drizzle/Pg'
import type { User } from '@kizamu/schema'
import { Effect } from 'effect'
import postgres from 'postgres'
import { DuplicateUserError } from './error'
import { usersTable } from './user.sql'

/**
 * ユーザーをデータベースに挿入する関数
 *
 * @param user - 挿入するユーザー情報
 * @returns 作成日時と更新日時が追加されたユーザー情報を含むEffect
 */
export const createUser = (
  user: User,
): Effect.Effect<User & { createdAt: Date; updatedAt: Date }, DuplicateUserError | SqlError.SqlError, PgDrizzle> =>
  // ) =>
  Effect.gen(function* () {
    // データベース接続を取得
    const db = yield* PgDrizzle
    // 作成日時と更新日時を追加した新しいユーザーオブジェクトを作成
    const newUser = {
      ...user,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    // ユーザーテーブルに新しいユーザーを挿入
    yield* db.insert(usersTable).values(newUser)
    // 挿入したユーザー情報を返却
    return newUser
  }).pipe(
    Effect.catchTags({
      SqlError: (sqlError) => {
        if (sqlError.cause instanceof postgres.PostgresError) {
          // 23505はユニーク制約違反のエラーコード
          if (sqlError.cause.code === '23505') {
            // ユーザーIDが重複している場合はDuplicateUserErrorを返す
            return Effect.fail(new DuplicateUserError({ userId: user.id }))
          }
        }
        return Effect.fail(sqlError)
      },
    }),
  )
