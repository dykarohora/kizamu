import type { SqlError } from '@effect/sql'
import { PgDrizzle } from '@effect/sql-drizzle/Pg'
import type { Card } from '@kizamu/schema'
import { and, eq, isNull, lte, or } from 'drizzle-orm'
import { Effect } from 'effect'
import { usersTable } from '../user/user.sql'
import { cardLearningStatesTable, cardsTable } from './card.sql'

/**
 * 指定されたユーザーの学習予定日が現在日時以前のカードを取得する
 * デッキIDが指定された場合は、そのデッキ内のカードのみを取得する
 * リミットが指定された場合は、指定された数のカードのみを取得する
 */
export const fetchDueCards = ({
  userId,
  deckId,
  limit,
}: {
  userId: string
  deckId?: string
  limit?: number
}): Effect.Effect<Card[], SqlError.SqlError, PgDrizzle> =>
  Effect.gen(function* () {
    // データベース接続を取得
    const db = yield* PgDrizzle

    // 現在の日時
    const now = new Date()

    // クエリの基本部分を構築
    // biome-ignore format:
    const baseQuery = db
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
      .leftJoin(
        cardLearningStatesTable,
        and(
          eq(cardsTable.id, cardLearningStatesTable.cardId), 
          eq(cardLearningStatesTable.studiedBy, userId)
        ),
      )
      .where(
        and(
          // デッキIDが指定されている場合は、そのデッキのカードのみを取得
          deckId ? eq(cardsTable.deckId, deckId) : undefined,
          or(
            // まだ一度も学習していないカード
            isNull(cardLearningStatesTable.cardId),
            // または学習予定日が現在日時以前のカード
            lte(cardLearningStatesTable.nextStudyDate, now),
          ),
        ),
      )
      .orderBy(cardsTable.createdAt)

    // クエリを実行して結果を取得
    const finalQuery = limit !== undefined ? baseQuery.limit(limit) : baseQuery

    const results = yield* finalQuery

    // 結果をカードの配列として返す
    return results.map((result) => ({
      id: result.id,
      deckId: result.deckId,
      createdBy: result.createdBy,
      frontContent: result.frontContent,
      backContent: result.backContent,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    }))
  })
