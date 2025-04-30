import type { SqlError } from '@effect/sql'
import { PgDrizzle } from '@effect/sql-drizzle/Pg'
import type { LearningProgress } from '@kizamu/schema'
import { and, eq } from 'drizzle-orm'
import { Effect } from 'effect'
import { cardLearningStatesTable } from './card.sql'

/**
 * 特定のユーザーと特定のカードの現在の学習状態を取得する
 * 学習履歴が存在しない場合はundefinedを返す
 *
 * @param cardId - 対象カードのID
 * @param userId - 対象ユーザーのID
 * @returns 学習状態またはundefined
 */
export const fetchCardLearningState = ({
  cardId,
  userId,
}: {
  cardId: string
  userId: string
}): Effect.Effect<LearningProgress | undefined, SqlError.SqlError, PgDrizzle> =>
  Effect.gen(function* () {
    // データベース接続を取得
    const db = yield* PgDrizzle

    // カード学習状態を検索
    const result = yield* db
      .select({
        easeFactor: cardLearningStatesTable.easeFactor,
        interval: cardLearningStatesTable.interval,
        nextStudyDate: cardLearningStatesTable.nextStudyDate,
      })
      .from(cardLearningStatesTable)
      .where(and(eq(cardLearningStatesTable.cardId, cardId), eq(cardLearningStatesTable.studiedBy, userId)))
      .limit(1)

    // 結果が見つからない場合はundefinedを返す
    if (result.length === 0) {
      return undefined
    }

    // 見つかった学習状態を返す
    return {
      easeFactor: result[0].easeFactor,
      interval: result[0].interval,
      nextStudyDate: result[0].nextStudyDate,
    }
  })
