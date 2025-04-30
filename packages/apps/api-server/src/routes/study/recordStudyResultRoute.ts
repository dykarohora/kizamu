import { fetchCardLearningState, recordStudyResult, transaction } from '@kizamu/db'
import { GradeSchema } from '@kizamu/schema'
import { Effect, Either, Schema, pipe } from 'effect'
import { Hono } from 'hono'
import { uuidv7 } from 'uuidv7'
import { effectValidator } from '../../middleware/validator'
import { runEffect } from '../../utils/runEffect'
import { calculateSM2Progress } from '../../utils/sm2'

export const recordStudyResultRoute = new Hono<{ Bindings: Env; Variables: { user: string } }>()

/**
 * リクエストボディのバリデーションスキーマ
 *
 * @property grade - 学習の成績評価（0-3の整数、0が最低、3が最高）
 * @property studiedAt - 学習した日時（ISO 8601形式の文字列）
 */
const requestBodySchema = Schema.Struct({
  grade: GradeSchema,
  studiedAt: Schema.String,
})

/**
 * カードの学習結果を記録するエンドポイント
 * @remarks
 * - パスパラメータでデッキIDとカードIDを指定
 * - SM-2アルゴリズムに基づいて次回学習日と易しさ係数を計算
 * - リクエストはユーザーの学習評価（0-3のgrade）と学習日時を含む
 * - エラー時は適切なステータスコードとエラーメッセージを返却
 *
 * @endpoint POST /decks/:deckId/cards/:cardId/study
 * @auth 要認証（ユーザーIDが必要）
 *
 * @param c - Honoのコンテキスト
 * @returns 次回学習日、易しさ係数、学習間隔
 */
const route = recordStudyResultRoute.post(
  '/decks/:deckId/cards/:cardId/study',
  effectValidator('json', requestBodySchema),
  (c) =>
    runEffect(
      Effect.gen(function* () {
        // パスパラメータ、リクエストボディ、ユーザーIDを取得
        const deckId = c.req.param('deckId')
        const cardId = c.req.param('cardId')
        const { grade, studiedAt } = c.req.valid('json')
        const userId = c.get('user')

        // 文字列からDate型に変換
        const studiedAtDate = new Date(studiedAt)

        // 無効な日付の場合はエラー
        if (Number.isNaN(studiedAtDate.getTime())) {
          return c.json({ code: 'INVALID_REQUEST', message: 'Invalid studiedAt date format' }, 400)
        }

        // 学習結果記録開始のログ出力
        yield* Effect.logInfo('Recording study result', {
          userId,
          deckId,
          cardId,
          grade,
          studiedAt,
        })

        const result = yield* Effect.either(
          transaction(
            Effect.gen(function* () {
              // 現在の学習状態を取得
              const currentLearningState = yield* fetchCardLearningState({ cardId, userId })

              // 学習状態に基づいてCardStudyオブジェクトを生成
              const cardStudy = calculateSM2Progress({
                id: uuidv7(),
                deckId,
                cardId,
                studiedBy: userId,
                grade,
                studiedAt: studiedAtDate,
                currentLearningState,
              })

              return yield* recordStudyResult(cardStudy)
            }),
          ),
        ).pipe(
          // 処理結果に応じたログ出力（処理自体には影響を与えない）
          Effect.tap(
            Either.match({
              // 成功時：デバッグログに学習結果とユーザーIDを記録
              onRight: (data) =>
                Effect.logDebug('Study result recorded successfully', {
                  userId,
                  cardId,
                  nextStudyDate: data.learningProgress.nextStudyDate,
                }),
              // 失敗時：エラーログにエラー内容、ユーザーID、カードIDを記録
              onLeft: (error) =>
                Effect.logError('Failed to record study result', {
                  error,
                  userId,
                  cardId,
                }),
            }),
          ),
        )

        // 結果をJSONレスポンスとして返却
        return pipe(
          result,
          Either.match({
            // 成功時：OpenAPIの仕様に合わせたレスポンス形式でデータを返す
            onRight: (data) =>
              c.json(
                {
                  nextStudyDate: data.learningProgress.nextStudyDate,
                  easeFactor: data.learningProgress.easeFactor,
                  interval: data.learningProgress.interval,
                },
                200,
              ),
            // 失敗時：エラー種別に応じて適切なエラーレスポンスを返す
            onLeft: (error) => {
              switch (error._tag) {
                case 'NotFoundCardError':
                  return c.json({ code: 'NOT_FOUND', message: 'The specified card was not found' }, 404)
                case 'NotFoundDeckError':
                  return c.json({ code: 'NOT_FOUND', message: 'The specified deck was not found' }, 404)
                case 'NotFoundUserError':
                  return c.json({ code: 'NOT_FOUND', message: 'The specified user was not found' }, 404)
                case 'SqlError':
                  return c.json({ code: 'INTERNAL_ERROR', message: 'An internal error occurred' }, 500)
                default:
                  throw new Error(`unexpected error: ${error satisfies never}`)
              }
            },
          }),
        )
      }),
    ),
)

export type RecordStudyResultRoute = typeof route
