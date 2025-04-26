import type { SqlError } from '@effect/sql'
import { PgDrizzle } from '@effect/sql-drizzle/Pg'
import type { Deck } from '@kizamu/schema'
import { and, asc, count, eq, gt } from 'drizzle-orm'
import { Effect } from 'effect'
import { usersTable } from '../user/user.sql'
import { decksTable } from './deck.sql'

type FetchDecksOptions = {
  userId: string
  cursor?: string
  limit?: number
}

type DeckListItem = Deck & { totalCards: number; dueCards: number }

type FetchDecksResult = {
  decks: DeckListItem[]
  nextCursor?: string
  total: number
}

/**
 * ユーザーのデッキ一覧を取得する
 *
 * @param options.userId - デッキを取得するユーザーのID
 * @param options.cursor - ページネーションのカーソル
 * @param options.limit - 1ページあたりの取得件数（デフォルト: 20, 最大: 50）
 * @returns デッキ一覧と次ページのカーソル情報
 */
export const fetchDecks = ({
  userId,
  cursor,
  limit = 20,
}: FetchDecksOptions): Effect.Effect<FetchDecksResult, SqlError.SqlError, PgDrizzle> =>
  Effect.gen(function* () {
    // limitが0以下の場合はデフォルト値を使用
    const normalizedLimit = limit <= 0 ? 20 : limit
    const actualLimit = Math.min(normalizedLimit, 50)

    // データベース接続を取得
    const db = yield* PgDrizzle

    // デッキ一覧を取得（作成者情報を結合）
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
      .where(
        // カーソルが指定されている場合は、カーソルより大きいIDのデッキを取得
        // biome-ignore format:
        cursor
          ? and(eq(decksTable.createdBy, userId), gt(decksTable.id, cursor))
          : eq(decksTable.createdBy, userId),
      )
      // デッキのIDはuuidv7を使用しているため、作成順でソートできる
      .orderBy(asc(decksTable.id))
      .limit(actualLimit + 1) // 次ページの存在確認のため1件多く取得

    // 次のページの存在を確認
    const hasNextPage = result.length > actualLimit
    const decks = result.slice(0, actualLimit)
    const nextCursor = hasNextPage ? decks[decks.length - 1].id : undefined

    // 総件数を取得
    const [{ total }] = yield* db.select({ total: count() }).from(decksTable).where(eq(decksTable.createdBy, userId))

    return {
      decks: decks.map((deck) => ({
        ...deck,
        totalCards: 0, // TODO: カード数の取得は別のクエリで実装する必要があります
        dueCards: 0, // TODO: 期限切れカード数の取得は別のクエリで実装する必要があります
      })),
      total,
      ...(hasNextPage ? { nextCursor } : {}),
    }
  })
