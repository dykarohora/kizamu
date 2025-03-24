import type { User } from '@kizamu/schema'
import { Effect, pipe } from 'effect'
import { redirect } from 'react-router'
import type { RequestContext } from '~/services/react-router/index.server'
import type { SessionService } from '~/services/session/index.server'
import { getAuthStatus } from './getAuthStatus'

/**
 * 認証が必要なルートに対して認証チェックを行う関数
 * @param failureRedirect - 未認証時にリダイレクトするURL
 * @returns Effect<User, Response, SessionService | RequestContext> - 認証済みの場合はユーザー情報を返し、未認証の場合はリダイレクトレスポンスを返すEffect
 */
export const requireAuth = (failureRedirect: string): Effect.Effect<User, Response, SessionService | RequestContext> =>
  pipe(
    Effect.gen(function* () {
      // 認証状態を取得
      const result = yield* getAuthStatus
      // 認証済みの場合はユーザー情報を返し、未認証の場合は指定されたURLにリダイレクト
      // biome-ignore format:
      return result.authenticated 
        ? result.user 
        : yield* Effect.failSync(() => redirect(failureRedirect))
    }),
    // エラーが発生した場合も指定されたURLにリダイレクト
    Effect.catchAll(() => Effect.failSync(() => redirect(failureRedirect))),
  )
