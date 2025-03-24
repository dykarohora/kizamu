import type { SqlError } from '@effect/sql'
import { PgDrizzle } from '@effect/sql-drizzle/Pg'
import type { User } from '@kizamu/schema'
import { eq } from 'drizzle-orm'
import { Effect } from 'effect'
import { NotFoundUserError } from './error'
import { usersTable } from './user.sql'

/**
 * ユーザー情報を更新する関数
 *
 * @param user - 更新するユーザー情報
 * @returns 更新されたユーザー情報を含むEffect。ユーザーが見つからない場合はNotFoundUserErrorを返す
 */
export const updateUser = (user: User): Effect.Effect<User, NotFoundUserError | SqlError.SqlError, PgDrizzle> =>
  Effect.gen(function* () {
    // データベース接続を取得
    const db = yield* PgDrizzle

    // 更新日時を含む更新データを作成
    const updateData = {
      name: user.name,
      updatedAt: new Date(),
    }

    // ユーザー情報を更新し、更新された行を取得
    const result = yield* db
      .update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, user.id))
      .returning({ id: usersTable.id })

    // 更新された行がない場合はNotFoundUserErrorを返す
    if (result.length === 0) {
      return yield* Effect.fail(new NotFoundUserError({ userId: user.id }))
    }

    // 更新後のユーザー情報を返却
    return user
  })
