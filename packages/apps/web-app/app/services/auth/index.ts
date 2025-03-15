import type { OAuth2RequestError } from 'arctic'
import { type ConfigError, Context, type Effect, Layer } from 'effect'
import type { ParseError } from 'effect/ParseResult'
import type { RequestContext } from '../react-router'
import type { SessionError, SessionService } from '../session'
import * as auth0 from './auth0'
import type { AuthenticationServiceError } from './error'

export class OAuth2Service extends Context.Tag('OAuth2Service')<
  OAuth2Service,
  {
    readonly authenticate: (
      successRedirectUrl: string,
    ) => Effect.Effect<
      Response,
      OAuth2RequestError | AuthenticationServiceError | SessionError | ConfigError.ConfigError,
      RequestContext | SessionService
    >
    readonly isAuthenticated: Effect.Effect<boolean, SessionError, SessionService | RequestContext>
    readonly logout: (redirectTo: string) => Effect.Effect<Response, SessionError, SessionService | RequestContext>
    readonly getAccessToken: Effect.Effect<
      { accessToken: string; setCookieHeaderValue?: string },
      SessionError | ParseError | AuthenticationServiceError | ConfigError.ConfigError,
      SessionService | RequestContext
    >
    readonly refreshAccessToken: Effect.Effect<
      { accessToken: string; setCookieHeaderValue: string },
      AuthenticationServiceError | SessionError | ConfigError.ConfigError | ParseError,
      SessionService | RequestContext
    >
  }
>() {}

// 認証サービスの実装(Auth0)
// biome-ignore format:
export const Auth0ServiceLive: Layer.Layer<OAuth2Service> = 
  Layer.succeed(
    OAuth2Service, 
    {
    authenticate: auth0.authenticate,
    isAuthenticated: auth0.isAuthenticated,
    logout: auth0.logout,
      refreshAccessToken: auth0.refreshAccessToken,
      getAccessToken: auth0.getAccessToken,
    },
  )
