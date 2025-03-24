import type { User } from '@kizamu/schema'
import { CodeChallengeMethod, OAuth2Client, OAuth2RequestError, generateCodeVerifier, generateState } from 'arctic'
import { type ConfigError, Effect, Redacted } from 'effect'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { redirect } from 'react-router'
import { RequestContext } from '~/services/react-router/index.server'
import { type SessionError, SessionService } from '~/services/session/index.server'
import { AuthenticationServiceError } from '../../error.server'
import { Auth0Config } from './config.server'
import { SESSION_KEYS } from './constants.server'

interface Auth0UserInfo {
  sub: string
  name: string
}

/**
 * OAuth2.0+OIDCの認可コードフロー＋PKCEにおいて、認可エンドポイントから認可コードを取得するためにユーザをリダイレクトする
 * @remarks
 * - PKCE拡張を使用して認可URLを作成
 * - state値とcode_verifierをセッションに保存
 * - audienceパラメータを追加（設定されている場合）
 */
const redirectToAuthorizationEndpoint = (
  client: OAuth2Client,
  config: { authOrigin: string; audience: string },
): Effect.Effect<Response, OAuth2RequestError | SessionError, RequestContext | SessionService> =>
  Effect.gen(function* (_) {
    const { getSession, commitSession } = yield* SessionService
    // セキュリティ対策としてランダムなstate値とcode_verifierを生成
    const state = generateState()
    const codeVerifier = generateCodeVerifier()
    yield* Effect.logInfo('OAuth2.0 + OIDCの認可コードフロー＋PKCEを開始します')

    // PKCE拡張を使用して認可URLを作成
    const url = client.createAuthorizationURLWithPKCE(
      `${config.authOrigin}/authorize`,
      state,
      CodeChallengeMethod.S256,
      codeVerifier,
      ['openid', 'profile', 'email', 'offline_access'],
    )

    // audienceが空文字でない場合、URLのクエリパラメータにaudienceを追加
    if (config.audience && config.audience.trim() !== '') {
      url.searchParams.append('audience', config.audience)
      yield* Effect.logInfo(`audienceパラメータを追加しました: ${config.audience}`)
    }

    // セッションにstate値とcode_verifierを保存
    const session = yield* getSession
    session.set(SESSION_KEYS.STATE, state)
    session.set(SESSION_KEYS.CODE_VERIFIER, codeVerifier)
    const cookie = yield* commitSession(session)

    yield* Effect.logInfo('セッションにstateとcode_verifierを保存しました')

    return yield* Effect.sync(() =>
      redirect(url.toString(), {
        headers: {
          'Set-Cookie': cookie,
        },
      }),
    )
  })

/**
 * トークンの検証とユーザー情報の取得を行う
 * @remarks
 * - IDトークンの署名検証
 * - ユーザー情報エンドポイントからプロフィール取得
 */
const validateTokensAndFetchUser = (
  result: { accessToken: () => string; idToken: () => string },
  config: { authOrigin: string; issuer: string; clientId: string },
): Effect.Effect<User, AuthenticationServiceError> =>
  Effect.gen(function* (_) {
    // JWKSエンドポイントから公開鍵セットを取得
    const jwks = yield* Effect.tryPromise({
      try: async () => createRemoteJWKSet(new URL(`${config.authOrigin}/.well-known/jwks.json`)),
      catch: (error) =>
        new AuthenticationServiceError({
          error,
          message: 'JWKSの取得に失敗しました。認証プロセスを再試行してください。',
        }),
    })

    // IDトークンの署名検証と発行者・対象者の検証
    yield* Effect.tryPromise({
      try: () => jwtVerify(result.idToken(), jwks, { issuer: config.issuer, audience: config.clientId }),
      catch: (error) =>
        new AuthenticationServiceError({
          error,
          message: 'JWKSの検証に失敗しました。認証プロセスを再試行してください。',
        }),
    })

    // ユーザー情報エンドポイントからプロフィールを取得
    return yield* Effect.tryPromise({
      try: async () => {
        const response = await fetch(`${config.authOrigin}/userinfo`, {
          headers: {
            Authorization: `Bearer ${result.accessToken()}`,
          },
        })

        const data = await response.json<Auth0UserInfo>()
        return { id: data.sub, name: data.name } satisfies User
      },
      catch: (error) =>
        new AuthenticationServiceError({
          error,
          message: 'ユーザー情報の取得に失敗しました。認証プロセスを再試行してください。',
        }),
    })
  })

/**
 * 認可コードを使用してトークンを取得し、セッションに保存する
 * @remarks
 * - stateの検証
 * - 認可コードの検証
 * - トークンの取得と検証
 * - ユーザー情報の取得
 * - セッションへの保存
 */
const exchangeCodeForTokens = (
  code: string,
  state: string,
  client: OAuth2Client,
  config: { authOrigin: string; issuer: string; clientId: string },
  successRedirectPath: string,
): Effect.Effect<
  Response,
  OAuth2RequestError | AuthenticationServiceError | SessionError,
  RequestContext | SessionService
> =>
  Effect.gen(function* (_) {
    const { getSession, commitSession } = yield* SessionService

    // セッションからstateを取得して検証
    const session = yield* getSession
    const savedState = session.get(SESSION_KEYS.STATE)

    // セキュリティ検証: セッションに保存されたstateとクエリパラメータのstateを比較
    if (savedState !== state) {
      yield* Effect.logWarning('stateの値が一致しません。CSRF攻撃の可能性があります。')
      return yield* Effect.fail(
        new AuthenticationServiceError({
          message: 'セキュリティ検証に失敗しました。認証プロセスを再開してください。',
        }),
      )
    }
    yield* Effect.logInfo('stateの検証に成功しました')

    // トークンエンドポイントでの認可コード検証
    const codeVerifier = session.get(SESSION_KEYS.CODE_VERIFIER)
    const result = yield* Effect.tryPromise({
      try: () => client.validateAuthorizationCode(`${config.authOrigin}/oauth/token`, code, codeVerifier),
      catch: (error) => {
        return new AuthenticationServiceError({
          error,
          message: 'トークンエンドポイントからのアクセストークン取得に失敗しました。認証プロセスを再試行してください。',
        })
      },
    })

    const user = yield* validateTokensAndFetchUser(result, config)

    // 認証情報をセッションに保存
    session.set(SESSION_KEYS.ACCESS_TOKEN, result.accessToken())
    session.set(SESSION_KEYS.REFRESH_TOKEN, result.refreshToken())
    session.set(SESSION_KEYS.ACCESS_TOKEN_EXPIRES_AT, result.accessTokenExpiresAt().toISOString())
    session.set(SESSION_KEYS.USER, user)

    const setCookieHeaderValue = yield* commitSession(session)

    // 認証完了後、指定されたパスにリダイレクト
    return yield* Effect.sync(() =>
      redirect(successRedirectPath, {
        headers: {
          'Set-Cookie': setCookieHeaderValue,
        },
      }),
    )
  })

/**
 * OAuth2.0 + OIDCによる認証フローを実行する
 * @param successRedirectUrl - 認証成功後のリダイレクト先パス
 */
export const authenticate = (
  successRedirectUrl: string,
): Effect.Effect<
  Response,
  OAuth2RequestError | AuthenticationServiceError | SessionError | ConfigError.ConfigError,
  RequestContext | SessionService
> =>
  Effect.gen(function* (_) {
    const { request } = yield* RequestContext

    const config = yield* Auth0Config
    const client = new OAuth2Client(config.clientId, Redacted.value(config.clientSecret), config.redirectUri)

    // URLオブジェクトを作成して比較を行う
    const currentUrl = new URL(request.url)
    const expectedRedirectUrl = new URL(config.redirectUri)

    // オリジン+パスの比較（クエリストリングは除外）
    const isRedirectUriMatch =
      currentUrl.origin === expectedRedirectUrl.origin && currentUrl.pathname === expectedRedirectUrl.pathname

    // クエリパラメータの取得
    const code = currentUrl.searchParams.get('code')
    const state = currentUrl.searchParams.get('state')
    const error = currentUrl.searchParams.get('error')

    // パラメータにエラーが含まれている場合は失敗させる
    if (error) {
      const description = currentUrl.searchParams.get('error_description')
      const uri = currentUrl.searchParams.get('error_uri')
      yield* Effect.logInfo(`[OAuth2RequestError] code:${error} description:${description}`)
      return yield* Effect.fail(new OAuth2RequestError(error, description, uri, state))
    }

    // リクエストがRedirectURI宛てでない場合は認可エンドポイントにリダイレクト
    if (!isRedirectUriMatch) {
      return yield* redirectToAuthorizationEndpoint(client, config)
    }

    // 認証コールバック処理
    if (isRedirectUriMatch && code && state) {
      return yield* exchangeCodeForTokens(code, state, client, config, successRedirectUrl)
    }

    return yield* Effect.fail(new AuthenticationServiceError({ message: '認証プロセスが見つかりません。' }))
  })
