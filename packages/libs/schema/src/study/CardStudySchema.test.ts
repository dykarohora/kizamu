import { expect, it } from '@effect/vitest'
import { Cause, Effect, Exit, Schema } from 'effect'
import { ParseError } from 'effect/ParseResult'
import { CardStudySchema } from './CardStudySchema'

it.effect('有効なカード学習データが検証を通過すること', () =>
  Effect.gen(function* () {
    expect.assertions(1)
    // Arrange
    const validCardStudy = {
      id: 'study123',
      cardId: 'card123',
      studiedBy: 'user123',
      deckId: 'deck123',
      studiedAt: new Date('2023-01-01T00:00:00Z'),
      grade: 3,
      learningProgress: {
        easeFactor: 2.5,
        interval: 6,
        nextStudyDate: new Date('2023-01-07T00:00:00Z'),
      },
    } as const
    // Act
    const result = yield* Schema.validate(CardStudySchema)(validCardStudy)
    // Assert
    expect(result).toEqual(validCardStudy)
  }),
)

// 異常系のテストケースをパラメータ化
it.effect.each([
  {
    testName: 'idが空文字列の場合',
    invalidCardStudy: {
      id: '',
      cardId: 'card123',
      studiedBy: 'user123',
      deckId: 'deck123',
      studiedAt: new Date('2023-01-01T00:00:00Z'),
      grade: 3,
      learningProgress: {
        easeFactor: 2.5,
        interval: 6,
        nextStudyDate: new Date('2023-01-07T00:00:00Z'),
      },
    },
  },
  {
    testName: '必須フィールド（id）が欠けている場合',
    invalidCardStudy: {
      cardId: 'card123',
      studiedBy: 'user123',
      deckId: 'deck123',
      studiedAt: new Date('2023-01-01T00:00:00Z'),
      grade: 3,
      learningProgress: {
        easeFactor: 2.5,
        interval: 6,
        nextStudyDate: new Date('2023-01-07T00:00:00Z'),
      },
    },
  },
  {
    testName: '必須フィールド（cardId）が欠けている場合',
    invalidCardStudy: {
      id: 'study123',
      studiedBy: 'user123',
      deckId: 'deck123',
      studiedAt: new Date('2023-01-01T00:00:00Z'),
      grade: 3,
      learningProgress: {
        easeFactor: 2.5,
        interval: 6,
        nextStudyDate: new Date('2023-01-07T00:00:00Z'),
      },
    },
  },
  {
    testName: '必須フィールド（studiedBy）が欠けている場合',
    invalidCardStudy: {
      id: 'study123',
      cardId: 'card123',
      deckId: 'deck123',
      studiedAt: new Date('2023-01-01T00:00:00Z'),
      grade: 3,
      learningProgress: {
        easeFactor: 2.5,
        interval: 6,
        nextStudyDate: new Date('2023-01-07T00:00:00Z'),
      },
    },
  },
  {
    testName: '必須フィールド（deckId）が欠けている場合',
    invalidCardStudy: {
      id: 'study123',
      cardId: 'card123',
      studiedBy: 'user123',
      studiedAt: new Date('2023-01-01T00:00:00Z'),
      grade: 3,
      learningProgress: {
        easeFactor: 2.5,
        interval: 6,
        nextStudyDate: new Date('2023-01-07T00:00:00Z'),
      },
    },
  },
  {
    testName: '必須フィールド（studiedAt）が欠けている場合',
    invalidCardStudy: {
      id: 'study123',
      cardId: 'card123',
      studiedBy: 'user123',
      deckId: 'deck123',
      grade: 3,
      learningProgress: {
        easeFactor: 2.5,
        interval: 6,
        nextStudyDate: new Date('2023-01-07T00:00:00Z'),
      },
    },
  },
  {
    testName: '必須フィールド（grade）が欠けている場合',
    invalidCardStudy: {
      id: 'study123',
      cardId: 'card123',
      studiedBy: 'user123',
      deckId: 'deck123',
      studiedAt: new Date('2023-01-01T00:00:00Z'),
      learningProgress: {
        easeFactor: 2.5,
        interval: 6,
        nextStudyDate: new Date('2023-01-07T00:00:00Z'),
      },
    },
  },
  {
    testName: '必須フィールド（learningProgress）が欠けている場合',
    invalidCardStudy: {
      id: 'study123',
      cardId: 'card123',
      studiedBy: 'user123',
      deckId: 'deck123',
      studiedAt: new Date('2023-01-01T00:00:00Z'),
      grade: 3,
    },
  },
  {
    testName: 'gradeが下限値未満の場合',
    invalidCardStudy: {
      id: 'study123',
      cardId: 'card123',
      studiedBy: 'user123',
      deckId: 'deck123',
      studiedAt: new Date('2023-01-01T00:00:00Z'),
      grade: -1, // 0未満の値
      learningProgress: {
        easeFactor: 2.5,
        interval: 6,
        nextStudyDate: new Date('2023-01-07T00:00:00Z'),
      },
    },
  },
  {
    testName: 'gradeが上限値超過の場合',
    invalidCardStudy: {
      id: 'study123',
      cardId: 'card123',
      studiedBy: 'user123',
      deckId: 'deck123',
      studiedAt: new Date('2023-01-01T00:00:00Z'),
      grade: 4, // 3を超える値
      learningProgress: {
        easeFactor: 2.5,
        interval: 6,
        nextStudyDate: new Date('2023-01-07T00:00:00Z'),
      },
    },
  },
  {
    testName: 'gradeが整数でない場合',
    invalidCardStudy: {
      id: 'study123',
      cardId: 'card123',
      studiedBy: 'user123',
      deckId: 'deck123',
      studiedAt: new Date('2023-01-01T00:00:00Z'),
      grade: 2.5, // 整数でない値
      learningProgress: {
        easeFactor: 2.5,
        interval: 6,
        nextStudyDate: new Date('2023-01-07T00:00:00Z'),
      },
    },
  },
  {
    testName: 'easeFactorが最小値未満の場合',
    invalidCardStudy: {
      id: 'study123',
      cardId: 'card123',
      studiedBy: 'user123',
      deckId: 'deck123',
      studiedAt: new Date('2023-01-01T00:00:00Z'),
      grade: 3,
      learningProgress: {
        easeFactor: 1.2, // 1.3未満の値
        interval: 6,
        nextStudyDate: new Date('2023-01-07T00:00:00Z'),
      },
    },
  },
  {
    testName: 'easeFactorが最大値超過の場合',
    invalidCardStudy: {
      id: 'study123',
      cardId: 'card123',
      studiedBy: 'user123',
      deckId: 'deck123',
      studiedAt: new Date('2023-01-01T00:00:00Z'),
      grade: 3,
      learningProgress: {
        easeFactor: 2.6, // 2.5を超える値
        interval: 6,
        nextStudyDate: new Date('2023-01-07T00:00:00Z'),
      },
    },
  },
  {
    testName: 'intervalが負の値の場合',
    invalidCardStudy: {
      id: 'study123',
      cardId: 'card123',
      studiedBy: 'user123',
      deckId: 'deck123',
      studiedAt: new Date('2023-01-01T00:00:00Z'),
      grade: 3,
      learningProgress: {
        easeFactor: 2.5,
        interval: -1, // 負の値
        nextStudyDate: new Date('2023-01-07T00:00:00Z'),
      },
    },
  },
  {
    testName: 'intervalが整数でない場合',
    invalidCardStudy: {
      id: 'study123',
      cardId: 'card123',
      studiedBy: 'user123',
      deckId: 'deck123',
      studiedAt: new Date('2023-01-01T00:00:00Z'),
      grade: 3,
      learningProgress: {
        easeFactor: 2.5,
        interval: 6.5, // 整数でない値
        nextStudyDate: new Date('2023-01-07T00:00:00Z'),
      },
    },
  },
  {
    testName: '無効な日付（studiedAt）の場合',
    invalidCardStudy: {
      id: 'study123',
      cardId: 'card123',
      studiedBy: 'user123',
      deckId: 'deck123',
      studiedAt: 'invalid-date', // 無効な日付形式
      grade: 3,
      learningProgress: {
        easeFactor: 2.5,
        interval: 6,
        nextStudyDate: new Date('2023-01-07T00:00:00Z'),
      },
    },
  },
  {
    testName: '無効な日付（nextStudyDate）の場合',
    invalidCardStudy: {
      id: 'study123',
      cardId: 'card123',
      studiedBy: 'user123',
      deckId: 'deck123',
      studiedAt: new Date('2023-01-01T00:00:00Z'),
      grade: 3,
      learningProgress: {
        easeFactor: 2.5,
        interval: 6,
        nextStudyDate: 'invalid-date', // 無効な日付形式
      },
    },
  },
  // 境界値テスト（有効なケース）
  {
    testName: 'gradeが下限境界値（0）の場合は有効',
    invalidCardStudy: {
      id: 'study123',
      cardId: 'card123',
      studiedBy: 'user123',
      deckId: 'deck123',
      studiedAt: new Date('2023-01-01T00:00:00Z'),
      grade: 0, // 下限境界値
      learningProgress: {
        easeFactor: 2.5,
        interval: 6,
        nextStudyDate: new Date('2023-01-07T00:00:00Z'),
      },
    },
    isValid: true, // この場合は有効なデータ
  },
  {
    testName: 'gradeが上限境界値（3）の場合は有効',
    invalidCardStudy: {
      id: 'study123',
      cardId: 'card123',
      studiedBy: 'user123',
      deckId: 'deck123',
      studiedAt: new Date('2023-01-01T00:00:00Z'),
      grade: 3, // 上限境界値
      learningProgress: {
        easeFactor: 2.5,
        interval: 6,
        nextStudyDate: new Date('2023-01-07T00:00:00Z'),
      },
    },
    isValid: true, // この場合は有効なデータ
  },
])('%sにエラーとなること', ({ invalidCardStudy, isValid = false }) =>
  Effect.gen(function* () {
    expect.assertions(1)
    // Act
    const result = yield* Effect.exit(Schema.validate(CardStudySchema)(invalidCardStudy))
    // Assert
    if (isValid) {
      if (Exit.isSuccess(result)) {
        expect(result.value).toEqual(invalidCardStudy)
      }
    } else {
      if (Exit.isFailure(result) && Cause.isFailType(result.cause)) {
        expect(result.cause.error).toBeInstanceOf(ParseError)
      }
    }
  }),
)
