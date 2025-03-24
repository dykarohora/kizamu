import { OAuth2Client } from 'arctic'
import { type ConfigError, Effect, Redacted, Schema, pipe } from 'effect'
import type { ParseError } from 'effect/ParseResult'
import type { RequestContext } from '~/services/react-router/index.server'
import { type SessionError, SessionService } from '~/services/session/index.server'
import { AuthenticationServiceError } from '../../error.server'
import { Auth0Config } from './config.server'
import { SESSION_KEYS } from './constants.server'

/**
 * アクセストークンをリフレッシュする
 * @returns 新しいアクセストークンとCookieヘッダー値
 * @remarks
 * - セッションからリフレッシュトークンを取得
 * - トークンエンドポイントでアクセストークンを更新
 * - 新しいトークンをセッションに保存
 */
export const refreshAccessToken: Effect.Effect<
  { accessToken: string; setCookieHeaderValue: string },
  AuthenticationServiceError | SessionError | ConfigError.ConfigError | ParseError,
  SessionService | RequestContext
> = Effect.gen(function* () {
  // Auth0の設定を取得してクライアントを初期化
  const config = yield* Auth0Config
  const client = new OAuth2Client(config.clientId, Redacted.value(config.clientSecret), config.redirectUri)

  // セッションからリフレッシュトークンを取得
  const { getSession, commitSession } = yield* SessionService
  const session = yield* getSession

  // biome-ignore format:
  const refreshToken = yield* pipe(
    session.get(SESSION_KEYS.REFRESH_TOKEN),
    Schema.validate(Schema.String)
  )

  // トークンエンドポイントでアクセストークンを更新
  const response = yield* Effect.tryPromise({
    try: () =>
      client.refreshAccessToken(`${config.authOrigin}/oauth/token`, refreshToken, [
        'openid',
        'profile',
        'email',
        'offline_access',
      ]),
    catch: (error) => new AuthenticationServiceError({ error, message: 'アクセストークンの更新に失敗しました' }),
  })

  // 新しいトークンを取得
  const newAccessToken = response.accessToken()
  const newRefreshToken = response.refreshToken()

  // セッションに新しいトークンを保存
  session.set(SESSION_KEYS.ACCESS_TOKEN, newAccessToken)
  session.set(SESSION_KEYS.REFRESH_TOKEN, newRefreshToken)
  const setCookieHeaderValue = yield* commitSession(session)

  return {
    accessToken: newAccessToken,
    setCookieHeaderValue,
  }
})
