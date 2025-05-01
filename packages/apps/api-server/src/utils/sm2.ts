import { CardStudySchema } from '@kizamu/schema'
import type { CardStudy, LearningProgress } from '@kizamu/schema'
import { addDays } from 'date-fns'

// SM-2アルゴリズムの定数
export const MAX_EASE_FACTOR = 2.5
export const INITIAL_EASE_FACTOR = 1.8
export const MINIMUM_EASE_FACTOR = 1.3
export const INITIAL_INTERVAL = 1 // 初回成功時の間隔（日数）

/**
 * SM-2アルゴリズムに基づいて学習進捗を計算し、CardStudyオブジェクトを生成する関数
 *
 * @param params - 必要なパラメータとオプションの現在の学習状態
 * @returns 計算された学習進捗情報を含むCardStudyオブジェクト
 */
export const calculateSM2Progress = (params: {
  id: string
  deckId: string
  cardId: string
  studiedBy: string
  grade: number
  studiedAt: Date
  currentLearningState: LearningProgress | undefined
}): CardStudy => {
  // 初期値の設定
  const currentEaseFactor = params.currentLearningState?.easeFactor ?? INITIAL_EASE_FACTOR
  const currentInterval = params.currentLearningState?.interval ?? 0

  // 学習が成功したかどうか（grade 2以上で成功）
  const isSuccessful = params.grade >= 2

  // 新しい易しさ係数を計算
  const newEaseFactor = isSuccessful
    ? Math.min(
        MAX_EASE_FACTOR,
        Math.max(
          MINIMUM_EASE_FACTOR,
          currentEaseFactor + (0.1 - (3 - params.grade) * (0.15 + (3 - params.grade) * 0.05)),
        ),
      )
    : currentEaseFactor

  // 新しい間隔を計算
  const newInterval = isSuccessful
    ? currentInterval === 0
      ? INITIAL_INTERVAL
      : currentInterval === 1
        ? 3
        : Math.round(currentInterval * newEaseFactor)
    : 1

  // 次回学習日を計算
  const nextStudyDate = addDays(params.studiedAt, newInterval)

  return CardStudySchema.make({
    id: params.id,
    deckId: params.deckId,
    cardId: params.cardId,
    studiedBy: params.studiedBy,
    grade: params.grade,
    studiedAt: params.studiedAt,
    learningProgress: {
      easeFactor: newEaseFactor,
      interval: newInterval,
      nextStudyDate,
    },
  })
}
