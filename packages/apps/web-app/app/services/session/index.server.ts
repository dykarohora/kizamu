import { createWorkersKVSessionStorage } from '@react-router/cloudflare'
import { Context, Data, Effect, Layer, pipe } from 'effect'
import { type SessionStorage, createCookieSessionStorage } from 'react-router'
import type { Session } from 'react-router'
import type { WorkersEnv } from '../../../load-context'
import { RequestContext } from '../react-router/index.server'

/**
 * セッション操作中に発生するエラーを表すクラス
 *
 * セッションの取得、保存、破棄などの操作中に問題が発生した場合に
 * このエラーがスローされます。エラーメッセージには具体的な問題の
 * 詳細が含まれます。
 */
export class SessionError extends Data.TaggedError('SessionError')<{ message: string }> {}

/**
 * セッション管理サービス
 *
 * セッションの取得、保存、破棄などの操作を提供するサービス
 */
export class SessionService extends Context.Tag('SessionService')<
  SessionService,
  {
    /**
     * リクエストからセッションを取得する
     *
     * @returns リクエストに関連付けられたセッションオブジェクト
     */
    readonly getSession: Effect.Effect<Session, SessionError, RequestContext>

    /**
     * セッションの変更を保存する
     *
     * @param session - 保存するセッションオブジェクト
     * @returns 新しいセッションCookie文字列
     */
    readonly commitSession: (session: Session) => Effect.Effect<string, SessionError>

    /**
     * セッションを破棄する
     *
     * @param session - 破棄するセッションオブジェクト
     * @returns セッションを削除するためのCookie文字列
     */
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
        getSession: Effect.flatMap(RequestContext, (requestContext) => {
          const { request } = requestContext
          return Effect.tryPromise({
            try: () => sessionStorage.getSession(request.headers.get('Cookie')),
            catch: (error) => new SessionError({ message: `Failed to get session: ${error}` }),
          })
        }),
        // セッションの変更を保存し、新しいCookie文字列を返す
        commitSession: (session: Session) =>
          Effect.tryPromise({
            try: () => sessionStorage.commitSession(session),
            catch: (error) => new SessionError({ message: `Failed to commit session: ${error}` }),
          }),
        // セッションを破棄し、Cookieを削除するための文字列を返す
        destroySession: (session: Session) =>
          Effect.tryPromise({
            try: () => sessionStorage.destroySession(session),
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
 * Cloudflare Workers KVを使用したSessionServiceの実装を作成する
 *
 * @param options.kvBindingKey - KVストアのバインディングキー名。Env['Bindings']内のKVNamespaceを持つキーのみ指定可能
 * @returns SessionServiceのLayer
 */
export const makeWorkersKVSessionStorageLive = ({
  kvBindingKey,
}: {
  kvBindingKey: keyof {
    [K in keyof WorkersEnv['Bindings'] as WorkersEnv['Bindings'][K] extends KVNamespace
      ? K
      : never]: WorkersEnv['Bindings'][K]
  }
}): Layer.Layer<SessionService> =>
  Layer.suspend(() =>
    pipe(
      // Workers KVをバックエンドとしたセッションストレージを作成
      createWorkersKVSessionStorage({
        // Cookieの設定
        cookie: {
          name: '__kizamu_sid', // セッションIDを保存するCookieの名前
          secrets: ['secret'], // Cookieの署名に使用する秘密鍵
          sameSite: 'lax', // CSRF対策のためのSameSite属性
          httpOnly: true, // JavaScriptからのアクセスを防ぐ
          secure: process.bindings.NODE_ENV === 'production' || process.bindings.NODE_ENV === 'staging', // 本番環境ではHTTPSのみ許可
        },
        // 指定されたキーのKVストアを使用
        kv: process.bindings[kvBindingKey],
      }),
      // 作成したストレージを使用してSessionServiceを構築
      makeSessionStorageLive,
    ),
  )
