import { css } from 'styled-system/css'
import type { Card } from '@kizamu/schema'

/**
 * カードコンテナのスタイル
 * 3D効果のあるカードコンテナのCSS文字列
 */
const cardContainerClass = css({
  perspective: '1000px',
  width: '100%',
  height: '35dvh',
  maxWidth: '800px',
  margin: '0 auto',
  mb: '6',
})

/**
 * カードボタンの基本スタイル
 * ボタンとして機能するカード要素のCSS文字列
 */
const cardButtonClass = css({
  position: 'relative',
  width: '100%',
  height: '100%',
  cursor: 'pointer',
  transformStyle: 'preserve-3d',
  transition: 'transform 0.2s',
  borderRadius: 'md',
  boxShadow: 'lg',
  padding: 0,
  border: 'none',
  background: 'none',
  display: 'block',
})

/**
 * カード面の共通スタイル
 * 表面と裏面で共通するCSS文字列
 */
const cardFaceClass = css({
  position: 'absolute',
  top: 0,
  width: '100%',
  height: '100%',
  backfaceVisibility: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'white',
  border: '1px solid',
  borderColor: 'border.default',
  rounded: 'md',
  padding: '8',
})

/**
 * 裏面用の追加スタイル
 * 裏返し効果のためのCSS文字列
 */
const cardBackFaceClass = css({
  transform: 'rotateY(180deg)',
})

/**
 * カードコンテンツのスタイル
 * 表と裏のカードコンテンツに共通するテキストスタイルのCSS文字列
 */
const cardContentClass = css({
  fontSize: '2xl',
  fontWeight: 'medium',
  textAlign: 'center',
  width: '100%',
  wordBreak: 'break-word',
  marginY: 'auto',
  paddingY: '6',
})

/**
 * ヒントテキストのスタイル
 * 操作ヒントの表示に関する共通スタイルのCSS文字列
 */
const hintTextClass = css({
  fontSize: 'sm',
  color: 'fg.muted',
  width: '100%',
  textAlign: 'center',
  marginTop: '2',
})

/**
 * FlashCardコンポーネントのプロパティ型定義
 *
 * @property currentCard - 現在表示中のカード情報。未定義の場合もある
 * @property isFlipped - カードが裏返されているかどうかのフラグ
 * @property flipCard - カードを裏返すための関数
 * @property isLoading - データ送信中などの処理中状態を示すフラグ
 */
interface FlashCardProps {
  currentCard?: Card
  isFlipped: boolean
  flipCard: () => void
  isLoading: boolean
}

/**
 * フラッシュカードを表示するコンポーネント
 *
 * @description
 * 学習用フラッシュカードのUI表示を担当します。
 * カードの表面と裏面の切り替え機能を提供し、ユーザーが
 * クリックやキーボード操作でカードを裏返して内容を確認できます。
 * 3D反転アニメーションによって、実際のカードのような体験を提供します。
 * アクセシビリティを考慮し、キーボード操作（EnterキーとSpace）をサポートしています。
 *
 * @param {FlashCardProps} props - コンポーネントのプロパティ
 * @returns {JSX.Element} フラッシュカード表示コンポーネント
 */
export const FlashCard = ({ currentCard, isFlipped, flipCard, isLoading }: FlashCardProps) => (
  // カード全体のコンテナ - 3D空間のパースペクティブを設定
  <div className={cardContainerClass}>
    {/* カード本体 - クリック時やキーボード操作時に反転 */}
    <button
      type="button"
      onClick={flipCard}
      aria-label={isFlipped ? 'カードを表面に戻す' : 'カードを裏面に表示する'}
      className={cardButtonClass}
      style={{
        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
      }}
      disabled={isLoading}
    >
      {/* カードの表面 */}
      <div className={cardFaceClass}>
        {/* 表面のコンテンツ */}
        <div className={cardContentClass}>{currentCard?.frontContent}</div>
        <div className={hintTextClass}>（クリックして裏面を見る）</div>
      </div>

      {/* カードの裏面 - 180度回転させて表示 */}
      <div className={`${cardFaceClass} ${cardBackFaceClass}`}>
        {/* 裏面のコンテンツ */}
        <div className={cardContentClass}>{currentCard?.backContent}</div>
        <div className={hintTextClass}>（クリックして表面に戻る）</div>
      </div>
    </button>
  </div>
)
