import type { Card } from '@kizamu/schema'
import { useCallback, useState } from 'react'
import { useFetcher } from 'react-router'
import type { Route } from '../+types/Study'

interface UseStudySessionProps {
  cards: Card[]
}

type ActionData = NonNullable<Route.ComponentProps['actionData']>

/**
 * 学習セッションを管理するフック
 * @description
 * カードの表示・裏返し・評価・次のカードへの移動などの状態と操作を管理
 * APIとの連携も行う
 */
export const useStudySession = ({ cards: studyCards }: UseStudySessionProps) => {
  const [cards] = useState<Card[]>(() => studyCards)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [clearedCard, setClearedCard] = useState<string | undefined>(undefined)

  // カードを裏返す
  const flipCard = useCallback(() => {
    setIsFlipped((prev) => !prev)
  }, [])

  // React Routerのfetcherを使って学習結果を送信（型修正）
  const submitGrade = useFetcher<ActionData>()

  // 現在のカード
  const currentCard = cards.length > 0 ? cards[currentIndex] : null

  // 学習が完了したかどうか
  const isCompleted = currentIndex >= cards.length

  if (submitGrade.data?.success && submitGrade.data.cardId !== clearedCard) {
    setClearedCard(submitGrade.data.cardId)
    // 次のカードへ進む
    setIsFlipped(false)
    setCurrentIndex((prev) => prev + 1)
  }

  return {
    currentCard,
    currentIndex,
    isFlipped,
    isCompleted,
    totalCards: cards.length,
    progress: Math.min((currentIndex / cards.length) * 100, 100),
    flipCard,
    submitGrade,
  }
}
