import { Effect } from 'effect'
import { Outlet, data } from 'react-router'
import { css } from 'styled-system/css'
import { effectLoader } from '~/effect/index.server'
import { OAuth2Service } from '~/services/auth/index.server'
import { Footer } from '~/shared/components/layout/Footer'
import { Header } from '~/shared/components/layout/Header'
import type { Route } from './+types/MainLayout'

// レイアウトコンテナのスタイル
const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  overflow: 'hidden',
})

// ヘッダーのスタイル
const headerStyles = css({
  position: 'sticky',
  top: 0,
  zIndex: 10,
})

// メインコンテンツのスタイル
const mainStyles = css({
  flex: 1,
  overflow: 'auto',
  padding: { base: '10px', md: '20px' },
})

// フッターのスタイル
const footerStyles = css({
  position: 'sticky',
  bottom: 0,
  zIndex: 10,
})

/**
 * メインレイアウトのローダー関数
 * 認証状態を取得してコンポーネントに渡す
 */
export const loader = effectLoader(
  Effect.gen(function* () {
    const { getAuthStatus } = yield* OAuth2Service
    const authStatus = yield* getAuthStatus

    return yield* Effect.succeed(data({ authStatus }))
  }),
)

/**
 * メインレイアウトコンポーネント
 * ヘッダー、メインコンテンツ、フッターを含むアプリケーションの基本レイアウトを提供する
 */
const MainLayout = ({ loaderData: { authStatus } }: Route.ComponentProps) => {
  return (
    <div className={containerStyles}>
      <Header authStatus={authStatus} className={headerStyles} />
      <main className={mainStyles}>
        <Outlet />
      </main>
      <Footer className={footerStyles} />
    </div>
  )
}

export default MainLayout
