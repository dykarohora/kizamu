import { type ConfigError, Effect, Schema, pipe } from 'effect'
import type { ParseError } from 'effect/ParseResult'
import type { RequestContext } from '~/services/react-router/index.server'
import { type SessionError, SessionService } from '~/services/session/index.server'
import type { AuthenticationServiceError } from '../../error.server'
import { SESSION_KEYS } from './constants.server'
import { refreshAccessToken } from './refreshAccessToken.server'

/**
 * アクセストークンを取得する
 * @returns アクセストークンとCookieヘッダー値(トークンを更新した場合のみ)
 * @remarks
 * - セッションからアクセストークンと有効期限を取得
 * - 有効期限内の場合は現在のアクセストークンを返す
 * - 有効期限切れの場合は新しいトークンを取得して返す
 */
export const getAccessToken: Effect.Effect<
  { accessToken: string; setCookieHeaderValue?: string },
  SessionError | ParseError | AuthenticationServiceError | ConfigError.ConfigError,
  SessionService | RequestContext
> = Effect.gen(function* () {
  // セッションからアクセストークンを取得
  const { getSession } = yield* SessionService
  const session = yield* getSession

  // セッションからアクセストークンを取得して文字列として検証
  // biome-ignore format:
  const accessToken = yield* pipe(
    session.get(SESSION_KEYS.ACCESS_TOKEN),
    Schema.validate(Schema.String)
  )

  // セッションから有効期限を取得して日付として検証
  // biome-ignore format:
  const expiresAt = yield* pipe(
    session.get(SESSION_KEYS.ACCESS_TOKEN_EXPIRES_AT),
    Schema.decode(Schema.Date),
  )

  // 現在時刻と有効期限を比較
  const now = new Date()
  if (expiresAt > now) {
    // 有効期限内の場合は現在のアクセストークンを返す
    return { accessToken }
  }

  // 有効期限切れの場合は新しいトークンを取得
  return yield* refreshAccessToken
})
