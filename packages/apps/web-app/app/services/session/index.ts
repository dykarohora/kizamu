import { createCookieSessionStorage, type SessionStorage } from 'react-router'
import { Effect, Context, Data, Layer } from 'effect'
import type { Session } from 'react-router'
import { RequestContext } from '../react-router'
import { createWorkersKVSessionStorage } from '@react-router/cloudflare'

// セッション関連のエラー型
class SessionError extends Data.TaggedError('SessionError')<{ message: string }> {}

class SessionService extends Context.Tag('SessionService')<
  SessionService,
  {
    readonly getSession: Effect.Effect<Session, SessionError, RequestContext>
    readonly commitSession: (session: Session) => Effect.Effect<string, SessionError>
    readonly destroySession: (session: Session) => Effect.Effect<string, SessionError>
  }
>() {}

/**
 * セッションストレージを使用したSessionServiceの実装を作成する
 *
 * @param sessionStorage - 使用するセッションストレージ
 * @returns SessionServiceのLayer
 */
const makeSessionStorageLive = (sessionStorage: SessionStorage): Layer.Layer<SessionService> =>
  Layer.effect(
    SessionService,
    Effect.gen(function* () {
      return {
        // リクエストからCookieを取得し、セッションを取得する
        getSession: Effect.flatMap(RequestContext, (requestContext) =>
          Effect.tryPromise({
            try: async () => sessionStorage.getSession(requestContext.request.headers.get('Cookie')),
            catch: (error) => new SessionError({ message: `Failed to get session: ${error}` }),
          }),
        ),
        // セッションの変更を保存し、新しいCookie文字列を返す
        commitSession: (session: Session) =>
          Effect.tryPromise({
            try: async () => sessionStorage.commitSession(session),
            catch: (error) => new SessionError({ message: `Failed to commit session: ${error}` }),
          }),
        // セッションを破棄し、Cookieを削除するための文字列を返す
        destroySession: (session: Session) =>
          Effect.tryPromise({
            try: async () => sessionStorage.destroySession(session),
            catch: (error) => new SessionError({ message: `Failed to destroy session: ${error}` }),
          }),
      }
    }),
  )

/**
 * Cookieベースのセッションストレージを使用したSessionServiceの実装
 *
 * @param options - Cookieセッションストレージの設定オプション
 * @returns SessionServiceのLayer
 */
export const makeCookieSessionStorageLive = (
  options: Parameters<typeof createCookieSessionStorage>[0],
): Layer.Layer<SessionService> => {
  const sessionStorage: SessionStorage = createCookieSessionStorage(options)
  return makeSessionStorageLive(sessionStorage)
}

/**
 * Cloudflare Workers KVを使用したSessionServiceの実装
 *
 * @param options - Workers KVセッションストレージの設定オプション
 * @returns SessionServiceのLayer
 */
export const makeWorkersKVSessionStorageLive = (
  options: Parameters<typeof createWorkersKVSessionStorage>[0],
): Layer.Layer<SessionService> => {
  const sessionStorage: SessionStorage = createWorkersKVSessionStorage(options)
  return makeSessionStorageLive(sessionStorage)
}
