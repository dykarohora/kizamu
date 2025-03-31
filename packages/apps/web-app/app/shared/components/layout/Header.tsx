import { Bell, Sun } from 'lucide-react'
import type { ComponentPropsWithoutRef, FC } from 'react'
import { Link } from 'react-router'
import { css, cx } from 'styled-system/css'
import { flex } from 'styled-system/patterns'
import type { AuthStatus } from '../../../services/auth/index.server'
import { Avatar } from '../../components/ui/avatar'
import { Button } from '../../components/ui/button'
import { IconButton } from '../../components/ui/icon-button'

// ヘッダーのスタイル定義
const headerStyles = css({
  w: 'full',
  borderBottom: '1px solid',
  borderColor: 'border.default',
  bg: 'bg.default',
})

// ヘッダーコンテナのスタイル
const containerStyles = flex({
  maxW: '7xl',
  mx: 'auto',
  px: '4', // 1rem相当のスペーシングトークン
  py: '3', // 0.75rem相当のスペーシングトークン
  justify: 'space-between',
  align: 'center',
  w: 'full',
})

// ロゴコンテナのスタイル
const logoContainerStyles = flex({
  align: 'center',
  gap: '3', // 0.75rem相当のスペーシングトークン
  flex: 'none',
})

// ロゴのスタイル
const logoStyles = flex({
  h: '10',
  w: '10',
  align: 'center',
  justify: 'center',
  rounded: 'md',
  bg: 'colorPalette.default',
  color: 'colorPalette.fg',
  fontSize: '2xl',
  fontWeight: '800',
})

// ロゴテキストのスタイル
const logoTextStyles = css({
  fontSize: 'xl',
  fontWeight: 'semibold',
})

// ナビゲーションのスタイル
const navStyles = css({
  ml: 'auto',
  mr: '8',
  md: {
    display: 'block',
  },
})

// ナビリストのスタイル
const navListStyles = flex({
  gap: '6', // 1.5rem相当のスペーシングトークン
})

// ナビリンクのスタイル
const navLinkStyles = css({
  color: 'fg.subtle',
  _hover: {
    color: 'fg.muted',
  },
  fontWeight: 'bold',
  transition: 'color 0.1s ease-in-out',
})

// 右側コントロールのスタイル
const controlsStyles = flex({
  align: 'center',
  gap: '3', // 0.75rem相当のスペーシングトークン
  flex: 'none',
})

// HeaderPropsの型定義を変更
type HeaderProps = ComponentPropsWithoutRef<'header'> & {
  authStatus: AuthStatus
}

// コンポーネントの引数を変更
export const Header: FC<HeaderProps> = ({ authStatus, className, ...props }: HeaderProps) => {
  return (
    <header className={cx(headerStyles, className)} {...props}>
      <div className={containerStyles}>
        {/* ロゴ部分 */}
        <div className={logoContainerStyles}>
          <Link to="/" className={flex({ align: 'center', gap: '2' })}>
            <div className={logoStyles}>K</div>
            <span className={logoTextStyles}>Kizamu</span>
          </Link>
        </div>

        {/* ログイン状態に応じたナビゲーション */}
        {authStatus.authenticated ? (
          <>
            {/* ログイン後のナビゲーション */}
            <nav className={navStyles}>
              <ul className={navListStyles}>
                <li>
                  <Link to="/decks" className={navLinkStyles}>
                    デッキ
                  </Link>
                </li>
                <li>
                  <Link to="/tags" className={navLinkStyles}>
                    タグ
                  </Link>
                </li>
              </ul>
            </nav>

            {/* ログイン後の右側コントロール */}
            <div className={controlsStyles}>
              <IconButton variant="ghost" size="sm" aria-label="テーマ切り替え">
                <Sun className={css({ h: '5', w: '5' })} />
              </IconButton>

              <IconButton variant="ghost" size="sm" aria-label="通知">
                <Bell className={css({ h: '5', w: '5' })} />
              </IconButton>

              <Avatar name={authStatus.user.name[0]} className={css({ h: '8', w: '8', cursor: 'pointer' })} />
            </div>
          </>
        ) : (
          /* ログイン前の右側ボタン */
          <div className={controlsStyles}>
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
