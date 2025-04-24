import { createRequestHandler } from 'react-router'

declare module 'react-router' {
  export interface AppLoadContext {
    cloudflare: {
      env: Env
      ctx: ExecutionContext
    }
  }
}

const requestHandler = createRequestHandler(() => import('virtual:react-router/server-build'), import.meta.env.MODE)

export default {
  async fetch(request, env, ctx) {
    const processEnv = process.env

    // process.envプロパティを定義
    // getterを使用してctx.envの値を動的に取得できるようにする
    Object.defineProperty(process, 'env', {
      get() {
        // ctx.envのコピーを返す
        return { ...processEnv, ...env }
      },
    })

    return requestHandler(request, {
      cloudflare: { env, ctx },
    })
  },
} satisfies ExportedHandler<Env>
