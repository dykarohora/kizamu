import type { SqlError } from '@effect/sql'
import type { SqlClient } from '@effect/sql'
import { PgDrizzle } from '@effect/sql-drizzle/Pg'
import { eq } from 'drizzle-orm'
import { Effect, pipe } from 'effect'
import { cardsTable } from './card.sql'
import { NotFoundCardError } from './error'

/**
 * カードをIDで削除する
 *
 * @param cardId - 削除するカードのID
 * @returns 削除処理の結果を表すEffect
 */
export const deleteCardById = (
  cardId: string,
): Effect.Effect<void, NotFoundCardError | SqlError.SqlError, PgDrizzle | SqlClient.SqlClient> =>
  pipe(
    Effect.gen(function* () {
      // データベース接続を取得
      const db = yield* PgDrizzle

      // カード削除実行
      const result = yield* db.delete(cardsTable).where(eq(cardsTable.id, cardId)).returning({ id: cardsTable.id })

      // 削除された行がない場合はエラーを返す
      if (result.length === 0) {
        return yield* Effect.fail(new NotFoundCardError({ cardId }))
      }
    }),
  )
