import type { Card } from '@kizamu/schema'
import { useCallback, useEffect, useMemo, useState } from 'react'
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

  // カードを裏返す関数をメモ化
  const flipCard = useCallback(() => {
    setIsFlipped((prev) => !prev)
  }, [])

  // React Routerのfetcherを使って学習結果を送信
  const submitGrade = useFetcher<ActionData>()

  // 現在のカードをメモ化
  const currentCard = useMemo(() => (cards.length > 0 ? cards[currentIndex] : undefined), [cards, currentIndex])

  // 学習が完了したかどうかをメモ化
  const isCompleted = useMemo(() => currentIndex >= cards.length, [currentIndex, cards.length])

  // 進捗率を計算してメモ化
  const progress = useMemo(() => Math.min((currentIndex / cards.length) * 100, 100), [currentIndex, cards.length])

  // APIレスポンス後の状態更新を副作用に分離
  useEffect(() => {
    if (submitGrade.data?.success && submitGrade.data.cardId !== clearedCard) {
      setClearedCard(submitGrade.data.cardId)
      setIsFlipped(false)
      setCurrentIndex((prev) => prev + 1)
    }
  }, [submitGrade.data, clearedCard])

  return {
    currentCard,
    currentIndex,
    isFlipped,
    isCompleted,
    totalCards: cards.length,
    progress,
    flipCard,
    submitGrade,
  }
}
