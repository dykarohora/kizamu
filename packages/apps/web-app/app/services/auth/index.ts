import type { OAuth2RequestError } from 'arctic'
import { type ConfigError, Context, type Effect, Layer } from 'effect'
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
    // readonly getAccessToken: Effect.Effect<string, OAuth2RequestError, SessionService>
    // readonly refreshAccessToken: Effect.Effect<string, OAuth2RequestError, SessionService>
  }
>() {}

export const Auth0ServiceLive: Layer.Layer<OAuth2Service> =
  // biome-ignore format:
  Layer.succeed(
    OAuth2Service, 
    { authenticate: auth0.authenticate, isAuthenticated: auth0.isAuthenticated }
  )
