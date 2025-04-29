import type { SqlError } from '@effect/sql'
import { SqlClient } from '@effect/sql'
import type { PgDrizzle } from '@effect/sql-drizzle/Pg'
import { Effect, pipe } from 'effect'

/**
 * 指定されたEffectをデータベーストランザクション内で実行するヘルパー関数
 *
 * トランザクションの自動開始・コミット・ロールバックを行い、
 * データベース操作に関するコードを簡潔に記述できるようにする
 *
 * @param effect - トランザクション内で実行するEffect
 * @returns トランザクション内で実行された結果を含むEffect
 */
export const transaction = <A, E, R>(
  effect: Effect.Effect<A, E, R | PgDrizzle | SqlClient.SqlClient>,
): Effect.Effect<A, E | SqlError.SqlError, R | PgDrizzle | SqlClient.SqlClient> =>
  pipe(
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      return yield* sql.withTransaction(effect)
    }),
  )
