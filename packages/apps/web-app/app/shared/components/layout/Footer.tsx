import type { ComponentPropsWithoutRef, FC } from 'react'
import { css, cx } from 'styled-system/css'

// フッターのスタイル
const footerStyles = css({
  p: '3',
  textAlign: 'center',
  backgroundColor: 'bg.default',
  color: 'fg.default',
  borderTop: '1px solid',
  borderColor: 'border.default',
})

type FooterProps = ComponentPropsWithoutRef<'footer'>

/**
 * フッターコンポーネント
 * アプリケーション全体の下部に表示される著作権情報などを含むフッター
 */
export const Footer: FC<FooterProps> = ({ className, ...props }) => (
  <footer className={cx(footerStyles, className)} {...props}>
    © {new Date().getFullYear()} Kizamu - All rights reserved
  </footer>
)
