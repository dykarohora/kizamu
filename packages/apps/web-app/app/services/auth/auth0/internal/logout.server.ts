import { Effect } from 'effect'
import { redirect } from 'react-router'
import type { RequestContext } from '~/services/react-router/index.server'
import { type SessionError, SessionService } from '~/services/session/index.server'

/**
 * ログアウト処理を実行する
 * @param redirectTo - ログアウト後のリダイレクト先URL
 * @returns ログアウト後のリダイレクトレスポンス
 * @remarks
 * - セッションの破棄
 * - 指定されたURLへのリダイレクト
 * - ※Auth0ではToken Revocationはサポートされていない
 */
export const logout = (redirectTo: string): Effect.Effect<Response, SessionError, SessionService | RequestContext> =>
  Effect.gen(function* () {
    // Auth0の設定を取得
    const { getSession, destroySession } = yield* SessionService
    const session = yield* getSession

    // セッションを破棄してCookieを更新
    const setCookieHeaderValue = yield* destroySession(session)

    // 指定されたURLにリダイレクト
    return yield* Effect.sync(() =>
      redirect(redirectTo, {
        headers: {
          'Set-Cookie': setCookieHeaderValue,
        },
      }),
    )
  })
