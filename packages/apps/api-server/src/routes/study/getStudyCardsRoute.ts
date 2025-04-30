import { fetchDeckById, fetchDueCards } from '@kizamu/db'
import { Effect, Either, Schema, pipe } from 'effect'
import { Hono } from 'hono'
import { effectValidator } from '../../middleware/validator'
import { runEffect } from '../../utils/runEffect'

export const getStudyCardsRoute = new Hono<{ Bindings: Env; Variables: { user: string } }>()

/**
 * クエリパラメータのバリデーションスキーマ
 *
 * @property limit - 取得する学習カードの最大数（オプション、デフォルト20）
 */
const querySchema = Schema.Union(
  Schema.Struct({
    limit: Schema.optional(Schema.String),
  }),
  Schema.Undefined,
)

/**
 * 学習対象カードを取得するエンドポイント
 * @remarks
 * - パスパラメータでデッキIDを指定
 * - クエリパラメータで取得上限を制御可能
 * - 学習対象となるカードには以下のようなものが含まれる：
 *   1. 次回学習日が到来しているカード
 *   2. 未学習のカード
 * - エラー時は適切なステータスコードとエラーメッセージを返却
 *
 * @endpoint GET /decks/:deckId/study/cards
 * @auth 要認証（ユーザーIDが必要）
 *
 * @param c - Honoのコンテキスト
 * @returns 学習対象カードと統計情報
 */
const route = getStudyCardsRoute.get('/decks/:deckId/study/cards', effectValidator('query', querySchema), (c) =>
  runEffect(
    Effect.gen(function* () {
      // パスパラメータ、クエリパラメータ、ユーザーIDを取得
      const deckId = c.req.param('deckId')
      const query = c.req.valid('query')
      const userId = c.get('user')

      // クエリパラメータの処理
      const limit = query?.limit ? Number(query.limit) : 20

      // 学習カード取得開始のログ出力
      yield* Effect.logInfo('Fetching study cards by deck ID', {
        userId,
        deckId,
        limit,
      })

      // デッキ存在確認と学習カード取得を一連のパイプラインとして実行
      const result = yield* Effect.either(
        pipe(
          // まずデッキの存在を確認（存在しない場合はNotFoundDeckErrorが発生）
          fetchDeckById(deckId),
          // デッキが存在する場合のみ、学習対象カードを取得
          Effect.andThen(() =>
            fetchDueCards({
              userId,
              deckId,
              limit,
            }),
          ),
        ),
      ).pipe(
        // 処理結果に応じたログ出力（処理自体には影響を与えない）
        Effect.tap(
          Either.match({
            // 成功時：デバッグログにカード数とデッキIDを記録
            onRight: (cards) =>
              Effect.logDebug('Study cards fetched successfully', {
                count: cards.length,
                deckId,
              }),
            // 失敗時：エラーログにエラー内容、ユーザーID、デッキIDを記録
            onLeft: (error) =>
              Effect.logError('Failed to fetch study cards', {
                error,
                userId,
                deckId,
              }),
          }),
        ),
      )

      // 結果をJSONレスポンスとして返却
      return pipe(
        result,
        Either.match({
          // 成功時：OpenAPIの仕様に合わせたレスポンス形式でデータを返す
          onRight: (cards) => c.json({ cards }, 200),
          // 失敗時：エラー種別に応じて適切なエラーレスポンスを返す
          onLeft: (error) => {
            switch (error._tag) {
              case 'NotFoundDeckError':
                return c.json({ code: 'NOT_FOUND', message: 'The specified deck was not found' }, 404)
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

export type GetStudyCardsRoute = typeof route
