import { describe, expect, it } from 'vitest'
import { addDays } from 'date-fns'
import { calculateSM2Progress, INITIAL_EASE_FACTOR, MINIMUM_EASE_FACTOR, MAX_EASE_FACTOR } from './sm2'

describe('SM-2アルゴリズム', () => {
  // ベースとなるパラメータ
  const baseParams = {
    id: 'test-id',
    deckId: 'deck-id',
    cardId: 'card-id',
    studiedBy: 'user-id',
    studiedAt: new Date('2023-05-01T10:00:00Z'),
  }

  it('t', () => {
    expect(true).toBe(true)
  })

  describe('calculateSM2Progress', () => {
    it('学習履歴なしで成功した場合（grade=3）、初期間隔が1日になること', () => {
      // Arrange
      const params = {
        ...baseParams,
        grade: 3,
        currentLearningState: undefined,
      }

      // Act
      const result = calculateSM2Progress(params)

      // Assert
      expect.assertions(3)
      expect(result.learningProgress.interval).toBe(1) // 初回成功の間隔は1日
      expect(result.learningProgress.easeFactor).toBeGreaterThan(INITIAL_EASE_FACTOR) // 易しさ係数が増加
      expect(result.learningProgress.nextStudyDate).toEqual(addDays(params.studiedAt, 1)) // 次回学習日は1日後
    })

    it('学習履歴なしで失敗した場合（grade=1）、間隔が1日になること', () => {
      // Arrange
      const params = {
        ...baseParams,
        grade: 1,
        currentLearningState: undefined,
      }

      // Act
      const result = calculateSM2Progress(params)

      // Assert
      expect.assertions(3)
      expect(result.learningProgress.interval).toBe(1) // 失敗時の間隔は1日
      expect(result.learningProgress.easeFactor).toBe(INITIAL_EASE_FACTOR) // 易しさ係数は変化なし
      expect(result.learningProgress.nextStudyDate).toEqual(addDays(params.studiedAt, 1)) // 次回学習日は1日後
    })

    it('2回目の学習で成功した場合（interval=1）、間隔が3日になること', () => {
      // Arrange
      const params = {
        ...baseParams,
        grade: 2,
        currentLearningState: {
          easeFactor: INITIAL_EASE_FACTOR,
          interval: 1,
          nextStudyDate: new Date(),
        },
      }

      // Act
      const result = calculateSM2Progress(params)

      // Assert
      expect.assertions(3)
      expect(result.learningProgress.interval).toBe(3) // 2回目成功の間隔は3日
      expect(result.learningProgress.nextStudyDate).toEqual(addDays(params.studiedAt, 3)) // 次回学習日は3日後
      expect(result.learningProgress.easeFactor).toBeCloseTo(1.7, 1) // 易しさ係数が増加（おおよその値）
    })

    it('3回目以降の学習で成功した場合、間隔が前回の間隔×易しさ係数になること', () => {
      // Arrange
      const previousEaseFactor = 2.0
      const previousInterval = 3
      const params = {
        ...baseParams,
        grade: 3,
        currentLearningState: {
          easeFactor: previousEaseFactor,
          interval: previousInterval,
          nextStudyDate: new Date(),
        },
      }

      // Act
      const result = calculateSM2Progress(params)

      // Assert
      expect.assertions(3)
      expect(result.learningProgress.interval).toBe(Math.round(previousInterval * previousEaseFactor)) // 前回の間隔×易しさ係数
      expect(result.learningProgress.easeFactor).toBeGreaterThan(previousEaseFactor) // 易しさ係数が増加
      expect(result.learningProgress.nextStudyDate).toEqual(
        addDays(params.studiedAt, Math.round(previousInterval * previousEaseFactor)),
      ) // 次回学習日が正しい
    })

    it('既存の学習状態があり失敗した場合、間隔が1日にリセットされ、易しさ係数は維持されること', () => {
      // Arrange
      const previousEaseFactor = 2.1
      const params = {
        ...baseParams,
        grade: 1,
        currentLearningState: {
          easeFactor: previousEaseFactor,
          interval: 5,
          nextStudyDate: new Date(),
        },
      }

      // Act
      const result = calculateSM2Progress(params)

      // Assert
      expect.assertions(3)
      expect(result.learningProgress.interval).toBe(1) // 失敗時の間隔は1日にリセット
      expect(result.learningProgress.easeFactor).toBe(previousEaseFactor) // 易しさ係数は維持
      expect(result.learningProgress.nextStudyDate).toEqual(addDays(params.studiedAt, 1)) // 次回学習日は1日後
    })

    it('易しさ係数が最大値を超えないこと', () => {
      // Arrange
      const params = {
        ...baseParams,
        grade: 3,
        currentLearningState: {
          easeFactor: MAX_EASE_FACTOR, // すでに最大
          interval: 10,
          nextStudyDate: new Date(),
        },
      }

      // Act
      const result = calculateSM2Progress(params)

      // Assert
      expect.assertions(1)
      expect(result.learningProgress.easeFactor).toBe(MAX_EASE_FACTOR) // 最大値を超えない
    })

    it('易しさ係数が最小値を下回らないこと', () => {
      // Arrange
      const params = {
        ...baseParams,
        grade: 2, // かろうじて成功だが難しかった
        currentLearningState: {
          easeFactor: MINIMUM_EASE_FACTOR + 0.05, // 最小値ギリギリ
          interval: 5,
          nextStudyDate: new Date(),
        },
      }

      // Act
      const result = calculateSM2Progress(params)

      // Assert
      expect.assertions(1)
      expect(result.learningProgress.easeFactor).toBeGreaterThanOrEqual(MINIMUM_EASE_FACTOR) // 最小値を下回らない
    })

    it('CardStudySchemaの形式で返されること', () => {
      // Arrange
      const params = {
        ...baseParams,
        grade: 3,
        currentLearningState: undefined,
      }

      // Act
      const result = calculateSM2Progress(params)

      // Assert
      expect.assertions(8)
      expect(result.id).toBe(params.id)
      expect(result.deckId).toBe(params.deckId)
      expect(result.cardId).toBe(params.cardId)
      expect(result.studiedBy).toBe(params.studiedBy)
      expect(result.grade).toBe(params.grade)
      expect(result.studiedAt).toBe(params.studiedAt)
      expect(result.learningProgress.easeFactor).toBeDefined()
      expect(result.learningProgress.nextStudyDate).toBeDefined()
    })
  })
})
