import type { User } from '@kizamu/schema'
import type { OAuth2RequestError } from 'arctic'
import { type ConfigError, Context, type Effect, Layer } from 'effect'
import type { ParseError } from 'effect/ParseResult'
import type { RequestContext } from '../react-router/index.server'
import type { SessionError, SessionService } from '../session/index.server'
import * as auth0 from './auth0/index.server'
import type { AuthenticationServiceError } from './error.server'

/**
 * 認証状態を表す型
 * ユーザーの認証状態と、認証済みの場合はユーザー情報を提供する
 */
export type AuthStatus =
  | { authenticated: true; user: User } // 認証済み
  | { authenticated: false } // 未認証

/**
 * OAuth2認証サービスを提供するクラス
 *
 * このクラスは以下の認証関連機能を提供する
 * - OAuth2認証の実行とリダイレクト処理
 * - ユーザーの認証状態の取得
 * - ログアウト処理
 * - 認証必須ルートのガード
 * - アクセストークンの取得と更新
 *
 * @example
 * ```ts
 * // サービスの取得
 * const oauth2Service = yield* OAuth2Service
 *
 * // 認証実行
 * yield* oauth2Service.authenticate('/dashboard')
 *
 * // 認証状態の確認
 * const status = yield* oauth2Service.getAuthStatus
 * ```
 */
export class OAuth2Service extends Context.Tag('OAuth2Service')<
  OAuth2Service,
  {
    /**
     * OAuth2認証を実行し、認証後に指定されたURLにリダイレクトする
     * @param successRedirectUrl - 認証成功後のリダイレクト先URL
     * @returns 認証処理の結果を表すEffect
     */
    readonly authenticate: (
      successRedirectUrl: string,
    ) => Effect.Effect<
      Response,
      OAuth2RequestError | AuthenticationServiceError | SessionError | ConfigError.ConfigError,
      RequestContext | SessionService
    >

    /**
     * ユーザーの認証状態とユーザー情報を取得する
     * @returns 認証済みの場合は{authenticated: true, user: ユーザー情報}、未認証の場合は{authenticated: false}
     */
    readonly getAuthStatus: Effect.Effect<AuthStatus, SessionError | ParseError, SessionService | RequestContext>

    /**
     * ログアウト処理を実行し、指定されたURLにリダイレクトする
     * @param redirectTo - ログアウト後のリダイレクト先URL
     * @returns ログアウト処理の結果を表すEffect
     */
    readonly logout: (redirectTo: string) => Effect.Effect<Response, SessionError, SessionService | RequestContext>

    /**
     * 認証が必要なルートに対して認証チェックを行う
     * @param failureRedirect - 未認証時にリダイレクトするURL
     * @returns 認証済みの場合はユーザー情報を返し、未認証の場合はリダイレクトレスポンスを返すEffect
     */
    readonly requireAuth: (failureRedirect: string) => Effect.Effect<User, Response, SessionService | RequestContext>

    /**
     * アクセストークンを取得する
     * @returns アクセストークンと必要に応じてCookieヘッダー値を含むオブジェクト
     */
    readonly getAccessToken: Effect.Effect<
      { accessToken: string; setCookieHeaderValue?: string },
      SessionError | ParseError | AuthenticationServiceError | ConfigError.ConfigError,
      SessionService | RequestContext
    >

    /**
     * アクセストークンを更新する
     * @returns 新しいアクセストークンとCookieヘッダー値を含むオブジェクト
     */
    readonly refreshAccessToken: Effect.Effect<
      { accessToken: string; setCookieHeaderValue: string },
      AuthenticationServiceError | SessionError | ConfigError.ConfigError | ParseError,
      SessionService | RequestContext
    >
  }
>() {}

// 認証サービスの実装(Auth0)
export const Auth0ServiceLive: Layer.Layer<OAuth2Service> = Layer.succeed(OAuth2Service, {
  authenticate: auth0.authenticate,
  getAuthStatus: auth0.getAuthStatus,
  logout: auth0.logout,
  requireAuth: auth0.requireAuth,
  getAccessToken: auth0.getAccessToken,
  refreshAccessToken: auth0.refreshAccessToken,
})
