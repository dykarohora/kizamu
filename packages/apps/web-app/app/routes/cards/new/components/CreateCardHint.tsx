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
 * カード作成時のヒントコンポーネント
 * @description
 * カード作成画面でユーザーに対して以下の情報を提供：
 * - 効果的なカード作成のためのアドバイス
 * - タグの使用方法に関するヒント
 *
 * @example
 * ```tsx
 * <CreateCardHint />
 * ```
 */
export const CreateCardHint: FC = () => (
  <article className={containerStyle}>
    <InfoIcon className={iconStyle} size={20} />
    <div>
      <h3 className={titleStyle}>効果的なカードの作り方</h3>
      <p className={descriptionStyle}>
        表面には質問や単語、裏面には答えや説明を書きましょう。
        <br />
        タグを使うとカードの整理や検索が簡単になります。関連する内容ごとにタグ付けすることをおすすめします。
      </p>
    </div>
  </article>
)
