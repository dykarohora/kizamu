import type { SqlError } from '@effect/sql'
import { SqlClient } from '@effect/sql'
import { PgDrizzle } from '@effect/sql-drizzle/Pg'
import type { CardStudy } from '@kizamu/schema'
import { and, eq } from 'drizzle-orm'
import { Effect, pipe } from 'effect'
import postgres from 'postgres'
import { NotFoundDeckError } from '../deck'
import { NotFoundUserError } from '../user'
import { cardLearningStatesTable, studyEventsTable } from './card.sql'
import { NotFoundCardError } from './error'

/**
 * カード学習結果を記録し、学習状態を更新する
 *
 * @param cardStudy - 記録する学習履歴と学習状態を含むオブジェクト
 * @returns 記録された学習結果情報を含むEffect
 */
export const recordStudyResult = (
  cardStudy: CardStudy,
): Effect.Effect<
  CardStudy,
  NotFoundCardError | NotFoundUserError | NotFoundDeckError | SqlError.SqlError,
  PgDrizzle | SqlClient.SqlClient
> =>
  pipe(
    Effect.gen(function* () {
      // データベース接続を取得
      const sql = yield* SqlClient.SqlClient
      const db = yield* PgDrizzle

      // 現在時刻を取得
      const now = new Date()

      // 学習イベントデータを作成
      const studyEvent = {
        id: cardStudy.id,
        deckId: cardStudy.deckId,
        studiedBy: cardStudy.studiedBy,
        cardId: cardStudy.cardId,
        grade: cardStudy.grade,
        studiedAt: cardStudy.studiedAt,
      }

      // 学習状態データを作成
      const learningState = {
        cardId: cardStudy.cardId,
        studiedBy: cardStudy.studiedBy,
        easeFactor: cardStudy.learningProgress.easeFactor,
        interval: cardStudy.learningProgress.interval,
        nextStudyDate: cardStudy.learningProgress.nextStudyDate,
        updatedAt: now,
      }

      yield* Effect.logDebug('Recording card study result', {
        studyEvent: JSON.stringify(studyEvent),
        learningState: JSON.stringify(learningState),
      })

      // トランザクションで両方のテーブルにデータを挿入/更新
      yield* sql.withTransaction(
        Effect.gen(function* () {
          // 学習イベントをデータベースに記録
          yield* db.insert(studyEventsTable).values(studyEvent)

          // 既存の学習状態があるか確認
          const existingState = yield* db
            .select({ cardId: cardLearningStatesTable.cardId })
            .from(cardLearningStatesTable)
            .where(
              and(
                eq(cardLearningStatesTable.cardId, cardStudy.cardId),
                eq(cardLearningStatesTable.studiedBy, cardStudy.studiedBy),
              ),
            )
            .limit(1)

          if (existingState.length > 0) {
            // 既存の学習状態を更新
            yield* db
              .update(cardLearningStatesTable)
              .set(learningState)
              .where(
                and(
                  eq(cardLearningStatesTable.cardId, cardStudy.cardId),
                  eq(cardLearningStatesTable.studiedBy, cardStudy.studiedBy),
                ),
              )
          } else {
            // 新規の学習状態を作成
            yield* db.insert(cardLearningStatesTable).values({
              ...learningState,
              createdAt: now,
            })
          }
        }),
      )

      // 記録した学習結果情報を返却
      return cardStudy
    }),
    Effect.catchTags({
      SqlError: (error) => {
        if (error.cause instanceof postgres.PostgresError) {
          // 外部キー制約違反
          if (error.cause.code === '23503') {
            // 制約違反のメッセージをパースして原因を特定
            if (error.cause.message.includes('card_id')) {
              return Effect.fail(new NotFoundCardError({ cardId: cardStudy.cardId }))
            }
            if (error.cause.message.includes('deck_id')) {
              return Effect.fail(new NotFoundDeckError({ deckId: cardStudy.deckId }))
            }
            if (error.cause.message.includes('studied_by')) {
              return Effect.fail(new NotFoundUserError({ userId: cardStudy.studiedBy }))
            }
          }
        }
        return Effect.fail(error)
      },
    }),
  )
