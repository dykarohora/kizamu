import { fetchDeckById } from '@kizamu/db'
import { Effect, Either, pipe } from 'effect'
import { Hono } from 'hono'
import { runEffect } from '../../utils/runEffect'

export const getDeckByIdRoute = new Hono<{ Bindings: Env; Variables: { user: string } }>()

/**
 * 指定したデッキIDのデッキ情報を取得するエンドポイント
 * @remarks
 * - パスパラメータでデッキIDを指定
 * - 存在しないデッキIDの場合は404エラーを返却
 * - エラー時は適切なステータスコードとエラーメッセージを返却
 *
 * @endpoint GET /decks/:deckId
 * @auth 要認証（ユーザーIDが必要）
 *
 * @param c - Honoのコンテキスト
 * @returns デッキ情報
 */
const route = getDeckByIdRoute.get('/decks/:deckId', (c) =>
  runEffect(
    Effect.gen(function* () {
      // パスパラメータとユーザーIDを取得
      const deckId = c.req.param('deckId')
      const userId = c.get('user')

      // デッキ取得開始のログ出力
      yield* Effect.logInfo('Fetching deck by ID', {
        userId,
        deckId,
      })

      // デッキ情報を取得し、結果に応じてログを出力
      const result = yield* pipe(
        Effect.either(fetchDeckById(deckId)),
        Effect.tap(
          Either.match({
            onRight: (deck) =>
              Effect.logDebug('Deck fetched successfully', {
                deckId: deck.id,
                name: deck.name,
              }),
            onLeft: (error) =>
              Effect.logError('Failed to fetch deck', {
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
          onRight: (deck) => c.json(deck, 200),
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

export type GetDeckByIdRoute = typeof route
