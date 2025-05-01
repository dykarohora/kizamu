import { css } from 'styled-system/css'
import { Button } from '~/shared/components/ui/button'
import type { Card } from '@kizamu/schema'
import type { FetcherWithComponents } from 'react-router'
import type { Route } from '../+types/Study'

/**
 * アクションデータの型定義
 * アクション実行結果のデータ型
 */
type ActionData = NonNullable<Route.ComponentProps['actionData']>

/**
 * GradeButtonsコンポーネントのプロパティ型定義
 *
 * @property deckId - 学習中のデッキID
 * @property currentCard - 評価対象の現在のカード
 * @property submitGrade - 評価を送信するためのReact Router Fetcherオブジェクト
 */
interface GradeButtonsProps {
  deckId: string
  currentCard?: Card
  submitGrade: FetcherWithComponents<ActionData>
}

/**
 * 学習成績評価ボタン群を表示するコンポーネント
 *
 * @description
 * SM-2アルゴリズムに基づく自己評価ボタンを提供します。
 * ユーザーがカードの難易度を4段階（やり直し、難しい、簡単、完璧）で
 * 評価できるUIを表示し、その評価をAPIに送信する機能を担当します。
 * 評価結果は次回の復習間隔の計算に使用されます。
 *
 * 各ボタンは異なる色で視覚的に区別され、直感的な評価が可能です。
 * また、送信中は重複送信を防ぐために全ボタンを無効化します。
 *
 * @param {GradeButtonsProps} props - コンポーネントのプロパティ
 * @returns {JSX.Element} 評価ボタン群コンポーネント
 */
export const GradeButtons = ({ deckId, currentCard, submitGrade }: GradeButtonsProps) => {
  /**
   * フォーム送信の状態を管理する変数
   * idle以外の状態ではボタンをクリックできないようにする
   */
  const isLoading = submitGrade.state !== 'idle'

  /**
   * 送信中かどうかを示す状態変数
   * 送信中の場合はボタンにローディングインジケータを表示する
   */
  const isSubmitting = submitGrade.state === 'submitting'

  return (
    <div className={css({ display: 'flex', justifyContent: 'center', gap: '4' })}>
      {/* 評価「0」：やり直し - 完全に忘れていた場合の選択肢 */}
      <submitGrade.Form method="post" action={`/decks/${deckId}/study`}>
        <input type="hidden" name="grade" value="0" />
        <input type="hidden" name="cardId" value={currentCard?.id} />
        <Button
          type="submit"
          variant="solid"
          colorPalette="red"
          size="md"
          className={css({ minWidth: '100px' })}
          disabled={isLoading}
          loading={isSubmitting}
        >
          やり直し
        </Button>
      </submitGrade.Form>

      {/* 評価「1」：難しい - 思い出すのに苦労した場合の選択肢 */}
      <submitGrade.Form method="post" action={`/decks/${deckId}/study`}>
        <input type="hidden" name="grade" value="1" />
        <input type="hidden" name="cardId" value={currentCard?.id} />
        <Button
          type="submit"
          variant="solid"
          colorPalette="orange"
          size="md"
          className={css({ minWidth: '100px' })}
          disabled={isLoading}
          loading={isSubmitting}
        >
          難しい
        </Button>
      </submitGrade.Form>

      {/* 評価「2」：簡単 - 少し考えれば思い出せた場合の選択肢 */}
      <submitGrade.Form method="post" action={`/decks/${deckId}/study`}>
        <input type="hidden" name="grade" value="2" />
        <input type="hidden" name="cardId" value={currentCard?.id} />
        <Button
          type="submit"
          variant="solid"
          colorPalette="blue"
          size="md"
          className={css({ minWidth: '100px' })}
          disabled={isLoading}
          loading={isSubmitting}
        >
          簡単
        </Button>
      </submitGrade.Form>

      {/* 評価「3」：完璧 - すぐに思い出せた場合の選択肢 */}
      <submitGrade.Form method="post" action={`/decks/${deckId}/study`}>
        <input type="hidden" name="grade" value="3" />
        <input type="hidden" name="cardId" value={currentCard?.id} />
        <Button
          type="submit"
          variant="solid"
          colorPalette="green"
          size="md"
          className={css({ minWidth: '100px' })}
          disabled={isLoading}
          loading={isSubmitting}
        >
          完璧
        </Button>
      </submitGrade.Form>
    </div>
  )
}
