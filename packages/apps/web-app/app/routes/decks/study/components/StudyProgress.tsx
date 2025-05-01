import { css } from 'styled-system/css'

/**
 * StudyProgressコンポーネントのプロパティ型定義
 *
 * @property currentIndex - 現在学習中のカードのインデックス（0から始まる）
 * @property totalCards - 学習対象カードの総数
 * @property progress - 現在の進捗率（0〜100のパーセンテージ）
 */
interface StudyProgressProps {
  currentIndex: number
  totalCards: number
  progress: number
}

/**
 * 学習進捗を表示するコンポーネント
 *
 * @description
 * 学習セッション中のユーザーの進捗状況を視覚的に表示します。
 * 数値による進捗表示とプログレスバーの両方を提供することで、
 * ユーザーがセッション内での位置を把握しやすくします。
 *
 * @param {StudyProgressProps} props - コンポーネントのプロパティ
 * @returns {JSX.Element} 進捗表示コンポーネント
 */
export const StudyProgress = ({ currentIndex, totalCards, progress }: StudyProgressProps) => (
  <div className={css({ mb: '6' })}>
    {/* 数値による進捗表示部分 - 現在のカード位置と総数、およびパーセンテージを表示 */}
    <div className={css({ display: 'flex', justifyContent: 'space-between', mb: '2' })}>
      <p>
        進捗: {currentIndex} / {totalCards}
      </p>
      <p>{Math.round(progress)}%</p>
    </div>

    {/* 視覚的なプログレスバー - 学習の進行状況をバーの長さで表現 */}
    <div className={css({ w: '100%', h: '8px', bg: 'gray.100', borderRadius: 'full', overflow: 'hidden' })}>
      <div
        className={css({
          h: '100%',
          bg: 'colorPalette.default',
          transition: 'width 0.3s ease-in-out', // スムーズなアニメーション効果
        })}
        style={{ width: `${progress}%` }}
      />
    </div>
  </div>
)
