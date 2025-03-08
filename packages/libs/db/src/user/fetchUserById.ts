import type { SqlError } from '@effect/sql'
import { PgDrizzle } from '@effect/sql-drizzle/Pg'
import type { User } from '@kizamu/schema'
import { eq } from 'drizzle-orm'
import { Effect } from 'effect'
import { NotFoundUserError } from './error'
import { usersTable } from './user.sql'

/**
 * 指定されたIDのユーザーをデータベースから取得する関数
 *
 * @param userId - 取得するユーザーのID
 * @returns ユーザー情報を含むEffect。ユーザーが見つからない場合はNotFoundUserErrorを返す
 */
export const fetchUserById = (userId: string): Effect.Effect<User, NotFoundUserError | SqlError.SqlError, PgDrizzle> =>
  Effect.gen(function* () {
    // データベース接続を取得
    const db = yield* PgDrizzle

    // ユーザーテーブルから指定IDのユーザーを検索
    const result = yield* db
      .select({ id: usersTable.id, name: usersTable.name })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1)

    // ユーザーが見つからない場合はNotFoundUserErrorを返す
    if (result.length === 0) {
      return yield* new NotFoundUserError({ userId })
    }

    // 見つかったユーザー情報を返却
    return result[0]
  })
