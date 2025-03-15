import { Effect } from 'effect'
import type { RequestContext } from '~/services/react-router'
import { type SessionError, SessionService } from '~/services/session'
import { SESSION_KEYS } from './constants'

/**
 * ユーザーが認証済みかどうかを判定する
 * @remarks
 * セッションにユーザー情報が存在するかどうかで認証状態を判定します。
 * アクセストークンは認可（Authorization）のために使用され、認証状態の判定には使用しません。
 * @returns 認証済みの場合はtrue、未認証の場合はfalse
 */
export const isAuthenticated: Effect.Effect<boolean, SessionError, SessionService | RequestContext> = Effect.gen(
  function* () {
    const { getSession } = yield* SessionService
    const session = yield* getSession

    // セッションからユーザー情報を取得
    const user = session.get(SESSION_KEYS.USER)

    return !!user
  },
)
