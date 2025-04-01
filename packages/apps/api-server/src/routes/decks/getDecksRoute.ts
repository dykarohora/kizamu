import { fetchDecks } from '@kizamu/db'
import { Effect, Either, Schema, pipe } from 'effect'
import { Hono } from 'hono'
import { effectValidator } from '../../middleware/validator'
import { runEffect } from '../../utils/runEffect'

export const getDecksRoute = new Hono<{ Bindings: Env; Variables: { user: string } }>()

const querySchema = Schema.Union(
  Schema.Struct({
    cursor: Schema.optional(Schema.String),
    limit: Schema.optional(Schema.String),
  }),
  Schema.Undefined,
)

/**
 * デッキ一覧を取得するエンドポイント
 * @remarks
 * - クエリパラメータでページネーション制御が可能
 * - ユーザーIDに紐づくデッキのみを取得
 * - エラー時は500エラーを返却
 *
 * @param c - Honoのコンテキスト
 * @returns デッキ一覧とページネーション情報
 */
const route = getDecksRoute.get('/decks', effectValidator('query', querySchema), (c) =>
  runEffect(
    Effect.gen(function* () {
      // クエリパラメータとユーザーIDを取得
      const query = c.req.valid('query')
      const userId = c.get('user')

      // デッキ取得開始のログ出力
      yield* Effect.logInfo('Fetching decks', {
        userId,
        limit: query?.limit,
        cursor: query?.cursor,
      })

      // デッキ一覧を取得し、結果に応じてログを出力
      const result = yield* pipe(
        Effect.either(
          fetchDecks({
            userId,
            limit: query?.limit ? Number(query.limit) : undefined,
            cursor: query?.cursor,
          }),
        ),
        Effect.tap(
          Either.match({
            onRight: (data) =>
              Effect.logDebug('Decks fetched successfully', {
                count: data.decks.length,
                hasMore: !!data.nextCursor,
              }),
            onLeft: (error) =>
              Effect.logError('Failed to fetch decks', {
                error,
                userId,
                query,
              }),
          }),
        ),
      )

      // 結果をJSONレスポンスとして返却
      return pipe(
        result,
        Either.match({
          onRight: (data) => c.json(data, 200),
          onLeft: (_) => c.json({ code: 'INTERNAL_ERROR', message: 'An internal error occurred' }, 500),
        }),
      )
    }),
  ),
)

export type GetDecksRoute = typeof route
