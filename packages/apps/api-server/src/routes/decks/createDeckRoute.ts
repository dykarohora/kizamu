import { Effect, Either, pipe, Schema } from 'effect'
import { Hono } from 'hono'
import { effectValidator } from '../../middleware/validator'
import { createDeck } from '@kizamu/db'
import { uuidv7 } from 'uuidv7'
import { runEffect } from '../../utils/runEffect'

// リクエストボディのバリデーションスキーマ
const requestBodySchema = Schema.Struct({
  name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(100)),
  description: Schema.String.pipe(Schema.maxLength(1000)),
})

export const createDeckRoute = new Hono<{ Bindings: Env; Variables: { user: string } }>()

const route = createDeckRoute.post('/decks', effectValidator('json', requestBodySchema), (c) =>
  runEffect(
    Effect.gen(function* () {
      // バリデーション済みのリクエストボディとユーザー情報を取得
      const body = c.req.valid('json')
      const userId = c.get('user')

      // デッキ作成開始のログ出力
      yield* Effect.logInfo('Creating deck', {
        userId,
        name: body.name,
        description: body.description,
      })

      // デッキを作成し、結果に応じてログを出力
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
            onRight: (deck) =>
              Effect.logDebug('Deck created successfully', {
                deckId: deck.id,
                userId,
              }),
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
