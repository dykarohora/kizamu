import type { SqlError } from '@effect/sql'
import { PgDrizzle } from '@effect/sql-drizzle/Pg'
import type { Deck } from '@kizamu/schema'
import { eq } from 'drizzle-orm'
import { Effect } from 'effect'
import { usersTable } from '../user/user.sql'
import { decksTable } from './deck.sql'
import { NotFoundDeckError } from './error'

/**
 * 指定されたIDのデッキをデータベースから取得する関数
 *
 * @param deckId - 取得するデッキのID
 * @returns デッキ情報を含むEffect。デッキが見つからない場合はNotFoundDeckErrorを返す
 */
export const fetchDeckById = (deckId: string): Effect.Effect<Deck, NotFoundDeckError | SqlError.SqlError, PgDrizzle> =>
  Effect.gen(function* () {
    // データベース接続を取得
    const db = yield* PgDrizzle

    // デッキテーブルとユーザーテーブルを結合して検索
    const result = yield* db
      .select({
        id: decksTable.id,
        name: decksTable.name,
        description: decksTable.description,
        createdAt: decksTable.createdAt,
        updatedAt: decksTable.updatedAt,
        createdBy: {
          id: usersTable.id,
          name: usersTable.name,
        },
      })
      .from(decksTable)
      .innerJoin(usersTable, eq(decksTable.createdBy, usersTable.id))
      .where(eq(decksTable.id, deckId))
      .limit(1)

    // デッキが見つからない場合はNotFoundDeckErrorを返す
    if (result.length === 0) {
      return yield* Effect.fail(new NotFoundDeckError({ deckId }))
    }

    // デッキ情報を返却
    return result[0]
  })
