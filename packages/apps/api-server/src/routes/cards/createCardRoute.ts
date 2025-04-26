import { createCard } from '@kizamu/db'
import { Effect, Either, Schema, pipe } from 'effect'
import { Hono } from 'hono'
import { uuidv7 } from 'uuidv7'
import { effectValidator } from '../../middleware/validator'
import { runEffect } from '../../utils/runEffect'

/**
 * カード作成リクエストのバリデーションスキーマ
 *
 * @property frontContent - カード表面のテキストコンテンツ
 * @property backContent - カード裏面のテキストコンテンツ
 * @property frontImages - カード表面の画像ID配列（オプション）
 * @property backImages - カード裏面の画像ID配列（オプション）
 * @property tags - タグ名の配列（オプション）
 */
const requestBodySchema = Schema.Struct({
  frontContent: Schema.NonEmptyString,
  backContent: Schema.NonEmptyString,
  frontImages: Schema.optional(Schema.Array(Schema.String)),
  backImages: Schema.optional(Schema.Array(Schema.String)),
  tags: Schema.optional(Schema.Array(Schema.String)),
})

/**
 * カード作成のルーティング定義
 * 環境変数とユーザー情報を持つHonoインスタンス
 */
export const createCardRoute = new Hono<{ Bindings: Env; Variables: { user: string } }>()

/**
 * カードを新規作成するエンドポイント
 *
 * @endpoint POST /decks/:deckId/cards
 * @auth 要認証（ユーザーIDが必要）
 *
 * @request
 * - frontContent: カード表面のテキスト
 * - backContent: カード裏面のテキスト
 * - frontImages: カード表面の画像ID配列（オプション）
 * - backImages: カード裏面の画像ID配列（オプション）
 * - tags: タグ名の配列（オプション）
 *
 * @response
 * - 201: カード作成成功
 * - 400: 不正なリクエスト（未登録ユーザー）
 * - 404: デッキが見つからない
 * - 500: 内部エラー（重複カード、SQL実行エラー）
 */
const route = createCardRoute.post('/decks/:deckId/cards', effectValidator('json', requestBodySchema), (c) =>
  runEffect(
    Effect.gen(function* () {
      // リクエストパラメータとバリデーション済みのリクエストボディとユーザー情報を取得
      const deckId = c.req.param('deckId')
      const body = c.req.valid('json')
      const userId = c.get('user')

      // カード作成開始のログ出力
      // ユーザーID、デッキID、リクエスト内容を記録し、処理の追跡を可能にする
      yield* Effect.logDebug('Creating card', {
        userId,
        deckId,
        frontContent: body.frontContent,
        backContent: body.backContent,
      })

      // カードを作成し、結果に応じてログを出力
      // Either型を使用してエラーハンドリングを型安全に実装
      const result = yield* Effect.either(
        createCard({
          card: {
            id: uuidv7(),
            deckId,
            frontContent: body.frontContent,
            backContent: body.backContent,
          },
          createdBy: userId,
        }),
      ).pipe(
        Effect.tap(
          Either.match({
            // 成功時：デバッグログにカードIDとデッキIDとユーザーIDを記録
            onRight: (card) =>
              Effect.logInfo('Card created successfully', {
                cardId: card.id,
                deckId,
                userId,
              }),
            // 失敗時：エラーログにエラー内容、ユーザーID、デッキID、リクエスト内容を記録
            onLeft: (error) =>
              Effect.logError('Failed to create card', {
                error,
                userId,
                deckId,
                body,
              }),
          }),
        ),
      )

      // 結果をJSONレスポンスとして返却
      // エラー種別に応じて適切なステータスコードとメッセージを設定
      return pipe(
        result,
        Either.match({
          onRight: (card) => c.json(card, 201),
          onLeft: (error) => {
            switch (error._tag) {
              case 'NotFoundUserError':
                return c.json({ code: 'BAD_REQUEST', message: 'Request from a user not registered in the system' }, 400)
              case 'NotFoundDeckError':
                return c.json({ code: 'NOT_FOUND', message: 'The specified deck was not found' }, 404)
              case 'DuplicateCardError':
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

export type CreateCardRoute = typeof route
