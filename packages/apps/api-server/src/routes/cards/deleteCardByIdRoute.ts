import { deleteCardById, fetchCardById } from '@kizamu/db'
import { Effect, Either, pipe } from 'effect'
import { Hono } from 'hono'
import { runEffect } from '../../utils/runEffect'
import { ForbiddenError } from '../error/ForbiddenError'

export const deleteCardByIdRoute = new Hono<{ Bindings: Env; Variables: { user: string } }>()

/**
 * 指定したデッキIDとカードIDのカードを削除するエンドポイント
 * @remarks
 * - パスパラメータでデッキIDとカードIDを指定
 * - デッキの所有者のみがカードを削除可能
 * - 存在しないデッキID・カードIDの場合は404エラーを返却
 * - 権限エラーの場合は403エラーを返却
 * - エラー時は適切なステータスコードとエラーメッセージを返却
 *
 * @endpoint DELETE /decks/:deckId/cards/:cardId
 * @auth 要認証（ユーザーIDが必要）
 *
 * @param c - Honoのコンテキスト
 * @returns 削除結果
 */
const route = deleteCardByIdRoute.delete('/decks/:deckId/cards/:cardId', (c) =>
  runEffect(
    pipe(
      Effect.gen(function* () {
        // パスパラメータとユーザーIDを取得
        const deckId = c.req.param('deckId')
        const cardId = c.req.param('cardId')
        const userId = c.get('user')

        // カード削除開始のログ出力
        yield* Effect.logInfo('Deleting card by ID', {
          userId,
          deckId,
          cardId,
        })

        // カードの存在確認と作成者のチェック
        const card = yield* pipe(
          fetchCardById(cardId),
          Effect.tapBoth({
            onSuccess: (card) =>
              Effect.logDebug('Card fetched successfully', {
                cardId: card.id,
              }),
            onFailure: (error) =>
              Effect.logDebug('Failed to fetch card', {
                error,
                userId,
                deckId,
                cardId,
              }),
          }),
        )

        if (card.createdBy.id !== userId) {
          yield* Effect.logWarning('Unauthorized attempt to delete card', {
            userId,
            deckId,
            cardId,
          })
          return yield* Effect.fail(
            new ForbiddenError({ message: 'You do not have permission to delete cards in this deck' }),
          )
        }

        // カード削除を実行
        // 削除成功時はログを出力し、失敗時はエラーログを出力して自動的にエラーをスローする
        yield* pipe(
          deleteCardById(cardId),
          Effect.tapBoth({
            onSuccess: () =>
              Effect.logInfo('Card deleted successfully', {
                userId,
                deckId,
                cardId,
              }),
            onFailure: (error) =>
              Effect.logError('Failed to delete card', {
                error,
                userId,
                deckId,
                cardId,
              }),
          }),
        )
      }),
      // Effect処理の結果をEitherに変換してエラーハンドリングを行う
      Effect.either,
      // Either型の結果に基づいて適切なHTTPレスポンスを返却
      Effect.andThen(
        Either.match({
          // 成功時は成功レスポンスを返却
          onRight: () => c.json({ success: true }, 200),
          // エラー時はエラータイプに応じた適切なエラーレスポンスを返却
          onLeft: (error) => {
            switch (error._tag) {
              case 'ForbiddenError':
                return c.json({ code: 'FORBIDDEN', message: error.message }, 403)
              case 'NotFoundCardError':
                return c.json({ code: 'NOT_FOUND', message: 'The specified card was not found' }, 404)
              case 'SqlError':
                return c.json({ code: 'INTERNAL_ERROR', message: 'An internal error occurred' }, 500)
              default:
                throw new Error(`unexpected error: ${error satisfies never}`)
            }
          },
        }),
      ),
    ),
  ),
)

export type DeleteCardByIdRoute = typeof route
