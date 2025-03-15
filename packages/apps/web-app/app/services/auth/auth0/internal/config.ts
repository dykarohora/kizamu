import { Config } from 'effect'

/**
 * Auth0の設定値
 * @remarks
 * - Config.mapを使用して型安全に設定値を変換
 * - CLIENT_SECRETはRedacted型で保護
 */
export const Auth0Config = Config.map(
  Config.all([
    Config.string('AUTH0_CLIENT_ID'),
    Config.redacted('AUTH0_CLIENT_SECRET'),
    Config.string('AUTH0_REDIRECT_URI'),
    Config.string('AUTH0_AUTH_ORIGIN'),
    Config.string('AUTH0_ISSUER'),
    Config.string('AUTH0_AUDIENCE').pipe(Config.withDefault('')),
  ]),
  ([clientId, clientSecret, redirectUri, authOrigin, issuer, audience]) => ({
    clientId,
    clientSecret,
    redirectUri,
    authOrigin,
    issuer,
    audience,
  }),
)
