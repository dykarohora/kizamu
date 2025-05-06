import { Effect } from 'effect'
import { redirect } from 'react-router'
import { effectAction } from '~/effect/index.server'
import { OAuth2Service } from '~/services/auth/index.server'
import { HonoClientService } from '~/services/hono-client/index.server'
import { ActionContext } from '~/services/react-router/index.server'

/**
 * カード削除アクション
 * @description
 * - ユーザーの認証状態を確認し、未認証の場合はホームページにリダイレクト
 * - カードIDを使用して、カードをAPIで削除する
 * - 削除後はデッキ詳細ページにリダイレクトする
 */
export const action = effectAction(
  Effect.gen(function* () {
    // 認証関連のサービスを取得
    const { requireAuth, getAccessToken } = yield* OAuth2Service
    yield* requireAuth('/')

    // リクエストコンテキストを取得
    const { params, request } = yield* ActionContext

    // パラメータからデッキIDとカードIDを取得
    const deckId = params.deckId
    const cardId = params.cardId
    // リクエストメソッドを確認
    const method = request.method.toUpperCase()

    if (!deckId || !cardId || method !== 'DELETE') {
      return yield* Effect.succeed(
        redirect(`/decks/${deckId}/detail`, {
          status: 400,
        }),
      )
    }

    // アクセストークンを取得してAPIクライアントを初期化
    const { accessToken, setCookieHeaderValue } = yield* getAccessToken
    const hc = yield* HonoClientService

    // カードを削除
    const response = yield* Effect.promise(async () =>
      hc.decks[':deckId'].cards[':cardId'].$delete(
        { param: { deckId, cardId } },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      ),
    )

    // エラーレスポンスの場合もデッキ詳細ページにリダイレクト
    // APIエラーの詳細はサーバーサイドのログで確認
    if (response.status !== 200) {
      yield* Effect.logError('カード削除に失敗しました', {
        deckId,
        cardId,
        status: response.status,
      })
    }

    // 削除成功の場合はデッキ詳細ページにリダイレクト
    return yield* Effect.succeed(
      redirect(`/decks/${deckId}`, {
        ...(setCookieHeaderValue !== undefined && { headers: { 'Set-Cookie': setCookieHeaderValue } }),
      }),
    )
  }),
)
