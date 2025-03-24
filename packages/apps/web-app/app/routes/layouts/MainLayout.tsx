import { Effect } from 'effect'
import { Outlet, data } from 'react-router'
import { effectLoader } from '~/effect/index.server'
import { OAuth2Service } from '~/services/auth/index.server'
import { Header } from '~/shared/components/layout/Header'
import type { Route } from './+types/MainLayout'

export const loader = effectLoader(
  Effect.gen(function* () {
    // 認証サービスからAuthStatusを取得
    const { getAuthStatus } = yield* OAuth2Service
    const authStatus = yield* getAuthStatus

    return yield* Effect.succeed(data({ authStatus }))
  }),
)

const MainLayout = ({ loaderData: { authStatus } }: Route.ComponentProps) => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header authStatus={authStatus} />
      <main className="flex-1 p-4">
        {/* 子ルートのコンポーネントを表示 */}
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-white p-4 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Kizamu - フラッシュカード学習プラットフォーム
      </footer>
    </div>
  )
}

export default MainLayout
