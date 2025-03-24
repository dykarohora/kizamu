/**
 * セッションで使用するキー一覧
 * @remarks
 * - oauth2: プレフィックスを付けることで他のセッションキーとの衝突を防ぐ
 */
export const SESSION_KEYS = {
  STATE: 'oauth2:sessionState',
  CODE_VERIFIER: 'oauth2:codeVerifier',
  ACCESS_TOKEN: 'oauth2:accessToken',
  REFRESH_TOKEN: 'oauth2:refreshToken',
  ACCESS_TOKEN_EXPIRES_AT: 'oauth2:accessTokenExpiresAt',
  USER: 'oauth2:user',
} as const
