import type { SqlError } from '@effect/sql'
import { SqlClient } from '@effect/sql'
import { PgDrizzle } from '@effect/sql-drizzle/Pg'
import type { Card } from '@kizamu/schema'
import { Effect, pipe } from 'effect'
import postgres from 'postgres'
import { NotFoundDeckError } from '../deck'
import { NotFoundUserError } from '../user'
import { cardLearningStatesTable, cardsTable } from './card.sql'
import { DuplicateCardError } from './error'

/**
 * カード作成時に必要な情報を定義する型
 */
type CreateCardInput = {
  /** カード情報 */
  card: Pick<Card, 'id' | 'deckId' | 'frontContent' | 'backContent'>
  /** 学習者（作成者）のID */
  createdBy: string
}

/**
 * カードをデータベースに新規登録し、作成者の学習状態も初期化する
 *
 * @param input - カード情報と学習者（作成者）情報を含む入力オブジェクト
 * @returns 作成されたカードの情報を含むEffect
 */
export const createCard = (
  input: CreateCardInput,
): Effect.Effect<
  Card,
  DuplicateCardError | NotFoundDeckError | NotFoundUserError | SqlError.SqlError,
  PgDrizzle | SqlClient.SqlClient
> =>
  pipe(
    Effect.gen(function* () {
      // データベース接続を取得
      const sql = yield* SqlClient.SqlClient
      const db = yield* PgDrizzle

      // 現在時刻を取得
      const now = new Date()

      // カード情報を作成
      const newCard = {
        id: input.card.id,
        deckId: input.card.deckId,
        frontContent: input.card.frontContent,
        backContent: input.card.backContent,
        createdAt: now,
        updatedAt: now,
      }

      // 学習状態の初期値を作成
      const initialLearningState = {
        cardId: input.card.id,
        studiedBy: input.createdBy,
        easeFactor: 1.8, // デフォルトのSM-2アルゴリズムの値
        interval: 0, // 初期間隔は0日
        nextStudyDate: now, // 今すぐ学習可能にする
        createdAt: now,
        updatedAt: now,
      }

      yield* Effect.logDebug('Creating card with initial learning state', {
        card: JSON.stringify(newCard),
        learningState: JSON.stringify(initialLearningState),
      })

      // トランザクションで両方のテーブルにデータを挿入
      yield* sql.withTransaction(
        Effect.gen(function* () {
          // カード情報を挿入
          yield* db.insert(cardsTable).values(newCard)

          // 学習状態を挿入
          yield* db.insert(cardLearningStatesTable).values(initialLearningState)
        }),
      )

      // 作成されたカード情報を返却
      return newCard
    }),
    Effect.catchTags({
      SqlError: (error) => {
        if (error.cause instanceof postgres.PostgresError) {
          // 一意性制約違反（カードIDの重複）
          if (error.cause.code === '23505') {
            return Effect.fail(new DuplicateCardError({ cardId: input.card.id }))
          }
          // 外部キー制約違反
          if (error.cause.code === '23503') {
            // 制約違反のメッセージをパースして原因を特定
            if (error.cause.message.includes('deck_id')) {
              return Effect.fail(new NotFoundDeckError({ deckId: input.card.deckId }))
            }
            if (error.cause.message.includes('studied_by')) {
              return Effect.fail(new NotFoundUserError({ userId: input.createdBy }))
            }
          }
        }
        return Effect.fail(error)
      },
    }),
  )
