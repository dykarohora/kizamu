import { Effect, Exit } from 'effect'
import type { Simplify } from 'effect/Types'
import { Hono } from 'hono'
import { bearerAuth } from 'hono/bearer-auth'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { type CreateDeckRoute, createDeckRoute } from './routes/decks/createDeckRoute'
import { type GetDecksRoute, getDecksRoute } from './routes/decks/getDecksRoute'

export type ApiServerType = Simplify<GetDecksRoute | CreateDeckRoute>

const app = new Hono<{ Bindings: Env; Variables: { user: string } }>()

app.use(async (ctx, next) => {
  if (!Object.getOwnPropertyDescriptor(process, 'env')?.get) {
    const processEnv = process.env
    // process.envプロパティを定義
    // getterを使用してctx.envの値を動的に取得できるようにする
    Object.defineProperty(process, 'env', {
      get() {
        // ctx.envのコピーを返す
        return { ...processEnv, ...ctx.env }
      },
    })
  }

  return next()
})

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.use(
  '/api/*',
  bearerAuth({
    /**
     * JWTトークンを検証し、ユーザー認証を行う
     * @param token - 検証対象のJWTトークン
     * @param c - Honoのコンテキスト
     * @returns トークンが有効な場合はtrue、無効な場合はfalse
     */
    verifyToken: async (token, c) => {
      const effect = Effect.gen(function* () {
        // JWT検証プロセスの開始をログ出力
        Effect.logDebug('Starting JWT verification process')

        // Auth0のJWKS(JSON Web Key Set)を取得
        const jwks = yield* Effect.tryPromise({
          try: async () => {
            Effect.logDebug('Fetching JWKS from Auth0')
            const result = await createRemoteJWKSet(new URL(`${c.env.AUTH0_AUTH_ORIGIN}/.well-known/jwks.json`))
            Effect.logDebug('JWKS fetched successfully')
            return result
          },
          catch: (error) => {
            // JWKS取得失敗時のエラーログ出力
            Effect.logError('Failed to fetch JWKS', { error })
            return false as const
          },
        })

        // JWTトークンの検証とユーザー情報の設定
        return yield* Effect.tryPromise({
          try: async () => {
            Effect.logDebug('Verifying JWT token')
            const { payload } = await jwtVerify(token, jwks, {
              audience: c.env.AUTH0_CLIENT_ID,
              issuer: c.env.AUTH0_ISSUER,
            })
            // 検証成功時にユーザーIDをコンテキストに設定
            c.set('user', payload.sub)
            Effect.logInfo('JWT verification successful', { userId: payload.sub })
            return true as const
          },
          catch: (error) => {
            // JWT検証失敗時の警告ログ出力
            Effect.logWarning('JWT verification failed', { error })
            return false as const
          },
        })
      })

      // Effect実行結果に基づいて認証の成否を返却
      return Exit.match(await Effect.runPromiseExit(effect), {
        onSuccess: () => true,
        onFailure: () => false,
      })
    },
  }),
)

app.route('/api', getDecksRoute)
app.route('/api', createDeckRoute)
export default app
