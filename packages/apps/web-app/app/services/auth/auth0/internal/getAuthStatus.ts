import { UserSchema } from '@kizamu/schema'
import { Effect, Schema } from 'effect'
import type { ParseError } from 'effect/ParseResult'
import type { AuthStatus } from '~/services/auth/index.server'
import type { RequestContext } from '~/services/react-router/index.server'
import { type SessionError, SessionService } from '~/services/session/index.server'
import { SESSION_KEYS } from './constants.server'

/**
 * ユーザーの認証状態とユーザー情報を取得する
 * @remarks
 * セッションにユーザー情報が存在するかどうかで認証状態を判定します。
 * アクセストークンは認可（Authorization）のために使用され、認証状態の判定には使用しません。
 * ユーザー情報が存在する場合は、UserSchemaによって検証されたUser型として返します。
 * @returns 認証済みの場合は{authenticated: true, user: ユーザー情報}、未認証の場合は{authenticated: false}
 */
export const getAuthStatus: Effect.Effect<AuthStatus, SessionError | ParseError, SessionService | RequestContext> =
  Effect.gen(function* () {
    const { getSession } = yield* SessionService
    const session = yield* getSession
    // セッションからユーザー情報を取得
    const userData = session.get(SESSION_KEYS.USER)
    // ユーザー情報が存在する場合
    return userData
      ? { authenticated: true, user: yield* Schema.decodeUnknown(UserSchema)(userData) }
      : { authenticated: false }
  })
