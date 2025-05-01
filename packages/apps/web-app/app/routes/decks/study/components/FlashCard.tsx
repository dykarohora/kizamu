import { css } from 'styled-system/css'
import { Button } from '~/shared/components/ui/button'
import type { Card } from '@kizamu/schema'

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
 * アクセシビリティを考慮し、キーボード操作（EnterキーとSpace）をサポートしています。
 *
 * @param {FlashCardProps} props - コンポーネントのプロパティ
 * @returns {JSX.Element} フラッシュカード表示コンポーネント
 */
export const FlashCard = ({ currentCard, isFlipped, flipCard, isLoading }: FlashCardProps) => {
  /**
   * キーボードでカードを裏返す処理
   *
   * @description
   * アクセシビリティ向上のため、EnterキーまたはSpace（スペース）キーが
   * 押された場合にカードを裏返す機能を提供します。
   *
   * @param {React.KeyboardEvent} event - キーボードイベント
   */
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      flipCard()
    }
  }

  return (
    <Button
      variant="outline"
      className={css({
        minHeight: '300px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        mb: '6',
        padding: '6',
        borderRadius: 'md',
      })}
      onClick={flipCard}
      onKeyDown={handleKeyPress}
      disabled={isLoading}
    >
      {/* カードのコンテンツ表示部分 - 表面または裏面の内容を表示 */}
      <div className={css({ fontSize: 'xl', textAlign: 'center' })}>
        {isFlipped ? currentCard?.backContent : currentCard?.frontContent}
      </div>

      {/* カード操作のヒント表示 - ユーザーに操作方法を示す */}
      <div className={css({ mt: '4', fontSize: 'sm', color: 'fg.muted' })}>
        {isFlipped ? '（クリックして表面に戻る）' : '（クリックして裏面を見る）'}
      </div>
    </Button>
  )
}
