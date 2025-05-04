import type { SqlError } from '@effect/sql'
import { PgDrizzle } from '@effect/sql-drizzle/Pg'
import type { Card } from '@kizamu/schema'
import { eq } from 'drizzle-orm'
import { Effect } from 'effect'
import { cardsTable } from './card.sql'
import { usersTable } from '../user/user.sql'
import { NotFoundCardError } from './error'

/**
 * 指定されたIDのカードをデータベースから取得する関数
 *
 * @param cardId - 取得するカードのID
 * @returns カード情報を含むEffect。カードが見つからない場合はNotFoundCardErrorを返す
 */
export const fetchCardById = (cardId: string): Effect.Effect<Card, NotFoundCardError | SqlError.SqlError, PgDrizzle> =>
  Effect.gen(function* () {
    // データベース接続を取得
    const db = yield* PgDrizzle

    // カードテーブルとユーザーテーブルを結合して検索
    const result = yield* db
      .select({
        id: cardsTable.id,
        deckId: cardsTable.deckId,
        frontContent: cardsTable.frontContent,
        backContent: cardsTable.backContent,
        createdAt: cardsTable.createdAt,
        updatedAt: cardsTable.updatedAt,
        createdBy: {
          id: usersTable.id,
          name: usersTable.name,
        },
      })
      .from(cardsTable)
      .innerJoin(usersTable, eq(cardsTable.createdBy, usersTable.id))
      .where(eq(cardsTable.id, cardId))
      .limit(1)

    // カードが見つからない場合はNotFoundCardErrorを返す
    if (result.length === 0) {
      return yield* Effect.fail(new NotFoundCardError({ cardId }))
    }

    // カード情報を返却
    return result[0]
  })
