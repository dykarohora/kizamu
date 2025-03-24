import { Hono } from 'hono'
import type { WorkersEnv } from '../load-context'

const app = new Hono<WorkersEnv>()

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
  } else {
    // 既にprocess.bindingsが定義済みの場合はログを出力
    console.log('process.env is already defined')
  }
  // process.bindingsプロパティが未定義の場合
  if (!Object.getOwnPropertyDescriptor(process, 'bindings')?.get) {
    // process.bindingsプロパティを定義
    // getterを使用してctx.envの値を動的に取得できるようにする
    Object.defineProperty(process, 'bindings', {
      get() {
        // ctx.envのコピーを返す
        return { ...ctx.env }
      },
    })
  } else {
    // 既にprocess.bindingsが定義済みの場合はログを出力
    console.log('process.bindings is already defined')
  }

  await next()
})

export default app

declare global {
  namespace NodeJS {
    // Cloudflare WorkersのBindingsをprocessオブジェクトに追加
    // これにより、アプリケーション全体でprocess.bindingsを通じてKVやEnvironment Variablesにアクセスできるようになる
    // ただし、processにバインドされるのはクライアントとWorkersとのコネクションが開始されたあととなるので、
    // Workersの初期化時にアクセスしようとするとundefinedとなるため注意すること
    // モジュールの初期化プロセス等でBindingsの情報が必要である場合は、遅延評価等を活用してprocessへのバインドが完了したあとにアクセスするよう実装すること
    interface Process {
      bindings: WorkersEnv['Bindings']
    }
  }
}
