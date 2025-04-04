import { createDeck } from '@kizamu/db'
import { Effect, Either, Schema, pipe } from 'effect'
import { Hono } from 'hono'
import { uuidv7 } from 'uuidv7'
import { effectValidator } from '../../middleware/validator'
import { runEffect } from '../../utils/runEffect'

/**
 * デッキ作成リクエストのバリデーションスキーマ
 *
 * @property name - デッキ名（1-100文字）
 * @property description - デッキの説明（最大1000文字）
 */
const requestBodySchema = Schema.Struct({
  name: Schema.NonEmptyString,
  description: Schema.NonEmptyString,
})

/**
 * デッキ作成のルーティング定義
 * 環境変数とユーザー情報を持つHonoインスタンス
 */
export const createDeckRoute = new Hono<{ Bindings: Env; Variables: { user: string } }>()

/**
 * デッキを新規作成するエンドポイント
 *
 * @endpoint POST /decks
 * @auth 要認証（ユーザーIDが必要）
 *
 * @request
 * - name: デッキ名（1-100文字）
 * - description: デッキの説明（最大1000文字）
 *
 * @response
 * - 201: デッキ作成成功
 * - 400: 不正なリクエスト（未登録ユーザー）
 * - 500: 内部エラー（重複デッキ、SQL実行エラー）
 */
const route = createDeckRoute.post('/decks', effectValidator('json', requestBodySchema), (c) =>
  runEffect(
    Effect.gen(function* () {
      // バリデーション済みのリクエストボディとユーザー情報を取得
      const body = c.req.valid('json')
      const userId = c.get('user')

      // デッキ作成開始のログ出力
      // ユーザーIDとリクエスト内容を記録し、処理の追跡を可能にする
      yield* Effect.logDebug('Creating deck', {
        userId,
        name: body.name,
        description: body.description,
      })

      // デッキを作成し、結果に応じてログを出力
      // Either型を使用してエラーハンドリングを型安全に実装
      const result = yield* Effect.either(
        createDeck({
          id: uuidv7(),
          name: body.name,
          description: body.description,
          createdBy: userId,
        }),
      ).pipe(
        Effect.tap(
          Either.match({
            // 成功時：デバッグログにデッキIDとユーザーIDを記録
            onRight: (deck) =>
              Effect.logInfo('Deck created successfully', {
                deckId: deck.id,
                userId,
              }),
            // 失敗時：エラーログにエラー内容、ユーザーID、リクエスト内容を記録
            onLeft: (error) =>
              Effect.logError('Failed to create deck', {
                error,
                userId,
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
          onRight: (deck) => c.json(deck, 201),
          onLeft: (error) => {
            switch (error._tag) {
              case 'NotFoundUserError':
                return c.json({ code: 'BAD_REQUEST', message: 'Request from a user not registered in the system' }, 400)
              case 'DuplicateDeckError':
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

export type CreateDeckRoute = typeof route
