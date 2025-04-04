import { InfoIcon } from 'lucide-react'
import type { FC } from 'react'
import { css } from 'styled-system/css'

/**
 * ヒントコンポーネントのスタイル定義
 * @description
 * - container: ヒント全体のコンテナスタイル
 * - icon: アイコンのスタイル
 * - title: タイトルのスタイル
 * - description: 説明文のスタイル
 */

// コンテナのスタイル
const containerStyle = css({
  backgroundColor: 'bg.subtle',
  borderRadius: 'md',
  p: '4',
  border: '1px solid',
  borderColor: 'border.muted',
  display: 'flex',
  gap: '3',
  alignItems: 'flex-start',
})

// アイコンのスタイル
const iconStyle = css({
  color: 'colorPalette.default',
  flexShrink: 0,
})

// タイトルのスタイル
const titleStyle = css({
  fontWeight: 'bold',
  mb: '2',
  fontSize: 'md',
  color: 'fg.default',
})

// 説明文のスタイル
const descriptionStyle = css({
  fontSize: 'sm',
  color: 'fg.muted',
  lineHeight: '1.6',
})

/**
 * デッキ作成時のヒントコンポーネント
 * @description
 * デッキ作成画面でユーザーに対して以下の情報を提供：
 * - デッキ作成後の次のステップ
 * - 効果的な学習のためのアドバイス
 *
 * @example
 * ```tsx
 * <CreateDeckHint />
 * ```
 */
export const CreateDeckHint: FC = () => (
  <article className={containerStyle}>
    <InfoIcon className={iconStyle} size={20} />
    <div>
      <h3 className={titleStyle}>デッキを作成した後は...</h3>
      <p className={descriptionStyle}>
        カードを追加して学習を始めることができます。
        <br />
        効果的な学習のために、関連する内容ごとにデッキを分けることをおすすめします。
      </p>
    </div>
  </article>
)
