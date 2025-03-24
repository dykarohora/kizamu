import { Bell, Sun } from 'lucide-react'
import { Link } from 'react-router'
import type { AuthStatus } from '../../../services/auth/index.server'
import { Avatar } from '../../components/ui/avatar'
import { Button } from '../../components/ui/button'
import { IconButton } from '../../components/ui/icon-button'

type HeaderProps = {
  authStatus: AuthStatus
}

export const Header = ({ authStatus }: HeaderProps) => {
  return (
    <header className="w-full border-b border-gray-200 bg-white px-4 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* ロゴ部分 */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-orange-600 text-white">K</div>
            <span className="text-xl font-semibold">Kizamu</span>
          </Link>
        </div>

        {/* ログイン状態に応じたナビゲーション */}
        {authStatus.authenticated ? (
          <>
            {/* ログイン後のナビゲーション */}
            <nav className="hidden md:block">
              <ul className="flex space-x-8">
                <li>
                  <Link to="/decks" className="text-gray-600 hover:text-gray-900">
                    デッキ
                  </Link>
                </li>
                <li>
                  <Link to="/tags" className="text-gray-600 hover:text-gray-900">
                    タグ
                  </Link>
                </li>
              </ul>
            </nav>

            {/* ログイン後の右側コントロール */}
            <div className="flex items-center space-x-4">
              <IconButton variant="ghost" size="sm" aria-label="テーマ切り替え">
                <Sun className="h-5 w-5" />
              </IconButton>

              <IconButton variant="ghost" size="sm" aria-label="通知">
                <Bell className="h-5 w-5" />
              </IconButton>

              <Avatar name={authStatus.user.name[0]} className="h-8 w-8 cursor-pointer" />
            </div>
          </>
        ) : (
          /* ログイン前の右側ボタン */
          <div className="flex items-center space-x-4">
            <Link to="/login">
              <Button variant="ghost">ログイン</Button>
            </Link>
            <Link to="/signup">
              <Button variant="solid">無料で始める</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
