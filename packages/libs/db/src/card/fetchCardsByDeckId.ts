import type { SqlError } from '@effect/sql'
import { PgDrizzle } from '@effect/sql-drizzle/Pg'
import type { Card } from '@kizamu/schema'
import { and, asc, count, eq, gt } from 'drizzle-orm'
import { Effect } from 'effect'
import { cardsTable } from './card.sql'
import { usersTable } from '../user/user.sql'

type FetchCardsOptions = {
  deckId: string
  cursor?: string
  limit?: number
}

type FetchCardsResult = {
  cards: Card[]
  nextCursor?: string
  total: number
}

/**
 * デッキに含まれるカード一覧を取得する
 *
 * @param options.deckId - カードを取得するデッキのID
 * @param options.cursor - ページネーションのカーソル
 * @param options.limit - 1ページあたりの取得件数（デフォルト: 20, 最大: 50）
 * @returns カード一覧と次ページのカーソル情報
 */
export const fetchCardsByDeckId = ({
  deckId,
  cursor,
  limit = 20,
}: FetchCardsOptions): Effect.Effect<FetchCardsResult, SqlError.SqlError, PgDrizzle> =>
  Effect.gen(function* () {
    // limitが0以下の場合はデフォルト値を使用
    const normalizedLimit = limit <= 0 ? 20 : limit
    const actualLimit = Math.min(normalizedLimit, 50)

    // データベース接続を取得
    const db = yield* PgDrizzle

    // カード一覧を取得
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
      .where(
        // カーソルが指定されている場合は、カーソルより大きいIDのカードを取得
        // biome-ignore format:
        cursor
          ? and(eq(cardsTable.deckId, deckId), gt(cardsTable.id, cursor))
          : eq(cardsTable.deckId, deckId),
      )
      // カードのIDはuuidv7を使用しているため、作成順でソートできる
      .orderBy(asc(cardsTable.id))
      .limit(actualLimit + 1) // 次ページの存在確認のため1件多く取得

    // 次のページの存在を確認
    const hasNextPage = result.length > actualLimit
    const cards = result.slice(0, actualLimit)
    const nextCursor = hasNextPage ? cards[cards.length - 1].id : undefined

    // 総件数を取得
    // biome-ignore format:
    const [{ total }] = yield* db
      .select({ total: count() })
      .from(cardsTable)
      .where(eq(cardsTable.deckId, deckId))

    return {
      cards,
      total,
      ...(hasNextPage ? { nextCursor } : {}),
    }
  })
