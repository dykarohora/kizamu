import { fetchCardsByDeckId } from '@kizamu/db'
import { fetchDeckById } from '@kizamu/db'
import { Effect, Either, Schema, pipe } from 'effect'
import { Hono } from 'hono'
import { effectValidator } from '../../middleware/validator'
import { runEffect } from '../../utils/runEffect'

export const getCardsByDeckIdRoute = new Hono<{ Bindings: Env; Variables: { user: string } }>()

/**
 * クエリパラメータのバリデーションスキーマ
 *
 * @property cursor - ページネーションのカーソル（オプション）
 * @property limit - 1ページあたりの取得件数（オプション）
 * @property tag - タグでフィルタリング（オプション、未実装）
 */
const querySchema = Schema.Union(
  Schema.Struct({
    cursor: Schema.optional(Schema.String),
    limit: Schema.optional(Schema.String),
    tag: Schema.optional(Schema.String),
  }),
  Schema.Undefined,
)

/**
 * デッキ内のカード一覧を取得するエンドポイント
 * @remarks
 * - パスパラメータでデッキIDを指定
 * - クエリパラメータでページネーション制御とタグフィルタリングが可能
 * - エラー時は適切なステータスコードとエラーメッセージを返却
 * - NotFoundDeckErrorの場合は404エラー、その他のエラーは500エラーを返す
 *
 * @endpoint GET /decks/:deckId/cards
 * @auth 要認証（ユーザーIDが必要）
 *
 * @param c - Honoのコンテキスト
 * @returns カード一覧とページネーション情報
 */
const route = getCardsByDeckIdRoute.get('/decks/:deckId/cards', effectValidator('query', querySchema), (c) =>
  runEffect(
    Effect.gen(function* () {
      // パスパラメータ、クエリパラメータ、ユーザーIDを取得
      const deckId = c.req.param('deckId')
      const query = c.req.valid('query')
      const userId = c.get('user')

      // カード取得開始のログ出力
      // ユーザーID、デッキID、クエリパラメータを記録し、処理の追跡を可能にする
      yield* Effect.logInfo('Fetching cards by deck ID', {
        userId,
        deckId,
        limit: query?.limit,
        cursor: query?.cursor,
        tag: query?.tag,
      })

      // デッキ存在確認とカード取得を一連のパイプラインとして実行
      // 失敗した場合はEitherのLeftに、成功した場合はRightに結果が入る
      const result = yield* Effect.either(
        pipe(
          // まずデッキの存在を確認（存在しない場合はNotFoundDeckErrorが発生）
          fetchDeckById(deckId),
          // デッキが存在する場合のみ、カード一覧を取得
          Effect.andThen(() =>
            fetchCardsByDeckId({
              deckId,
              limit: query?.limit ? Number(query.limit) : undefined,
              cursor: query?.cursor,
            }),
          ),
        ),
      ).pipe(
        // 処理結果に応じたログ出力（処理自体には影響を与えない）
        Effect.tap(
          Either.match({
            // 成功時：デバッグログにカード数とデッキIDを記録
            onRight: (data) =>
              Effect.logDebug('Cards fetched successfully', {
                count: data.cards.length,
                hasMore: !!data.nextCursor,
                deckId,
              }),
            // 失敗時：エラーログにエラー内容、ユーザーID、デッキIDを記録
            onLeft: (error) =>
              Effect.logError('Failed to fetch cards', {
                error,
                userId,
                deckId,
              }),
          }),
        ),
      )

      // 結果をJSONレスポンスとして返却
      // エラー種別に応じて適切なステータスコードとメッセージを設定
      return pipe(
        result,
        Either.match({
          // 成功時：OpenAPIの仕様に合わせたレスポンス形式でデータを返す
          onRight: (data) =>
            c.json(
              {
                data: data.cards,
                metadata: {
                  nextCursor: data.nextCursor || null,
                  limit: query?.limit ? Number(query.limit) : 20,
                  total: data.total,
                },
              },
              200,
            ),
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

export type GetCardsByDeckIdRoute = typeof route
