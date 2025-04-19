import { expect, it } from '@effect/vitest'
import { Cause, Effect, Exit, Schema } from 'effect'
import { ParseError } from 'effect/ParseResult'
import { CardLearningStateSchema } from './CardLearningStateSchema'

it.effect('有効なカード学習状況データが検証を通過すること', () =>
  Effect.gen(function* () {
    expect.assertions(1)
    // Arrange
    const validCardLearningState = {
      cardId: 'card123',
      studiedBy: 'user123',
      easeFactor: 2.5,
      interval: 1,
      nextStudyDate: new Date('2023-01-10T00:00:00Z'),
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-02T00:00:00Z'),
    } as const
    // Act
    const result = yield* Schema.validate(CardLearningStateSchema)(validCardLearningState)
    // Assert
    expect(result).toEqual(validCardLearningState)
  }),
)

// 異常系のテストケースをパラメータ化
it.effect.each([
  {
    testName: '必須フィールド（cardId）が欠けている場合',
    invalidCardLearningState: {
      studiedBy: 'user123',
      easeFactor: 2.5,
      interval: 1,
      nextStudyDate: new Date('2023-01-10T00:00:00Z'),
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-02T00:00:00Z'),
    },
  },
  {
    testName: '必須フィールド（studiedBy）が欠けている場合',
    invalidCardLearningState: {
      cardId: 'card123',
      easeFactor: 2.5,
      interval: 1,
      nextStudyDate: new Date('2023-01-10T00:00:00Z'),
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-02T00:00:00Z'),
    },
  },
  {
    testName: '必須フィールド（easeFactor）が欠けている場合',
    invalidCardLearningState: {
      cardId: 'card123',
      studiedBy: 'user123',
      interval: 1,
      nextStudyDate: new Date('2023-01-10T00:00:00Z'),
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-02T00:00:00Z'),
    },
  },
  {
    testName: '必須フィールド（interval）が欠けている場合',
    invalidCardLearningState: {
      cardId: 'card123',
      studiedBy: 'user123',
      easeFactor: 2.5,
      nextStudyDate: new Date('2023-01-10T00:00:00Z'),
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-02T00:00:00Z'),
    },
  },
  {
    testName: '必須フィールド（nextStudyDate）が欠けている場合',
    invalidCardLearningState: {
      cardId: 'card123',
      studiedBy: 'user123',
      easeFactor: 2.5,
      interval: 1,
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-02T00:00:00Z'),
    },
  },
  {
    testName: '必須フィールド（createdAt）が欠けている場合',
    invalidCardLearningState: {
      cardId: 'card123',
      studiedBy: 'user123',
      easeFactor: 2.5,
      interval: 1,
      nextStudyDate: new Date('2023-01-10T00:00:00Z'),
      updatedAt: new Date('2023-01-02T00:00:00Z'),
    },
  },
  {
    testName: '必須フィールド（updatedAt）が欠けている場合',
    invalidCardLearningState: {
      cardId: 'card123',
      studiedBy: 'user123',
      easeFactor: 2.5,
      interval: 1,
      nextStudyDate: new Date('2023-01-10T00:00:00Z'),
      createdAt: new Date('2023-01-01T00:00:00Z'),
    },
  },
  {
    testName: '空文字列のフィールド（cardId）の場合',
    invalidCardLearningState: {
      cardId: '',
      studiedBy: 'user123',
      easeFactor: 2.5,
      interval: 1,
      nextStudyDate: new Date('2023-01-10T00:00:00Z'),
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-02T00:00:00Z'),
    },
  },
  {
    testName: '空文字列のフィールド（studiedBy）の場合',
    invalidCardLearningState: {
      cardId: 'card123',
      studiedBy: '',
      easeFactor: 2.5,
      interval: 1,
      nextStudyDate: new Date('2023-01-10T00:00:00Z'),
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-02T00:00:00Z'),
    },
  },
  {
    testName: '無効な日付（nextStudyDate）の場合',
    invalidCardLearningState: {
      cardId: 'card123',
      studiedBy: 'user123',
      easeFactor: 2.5,
      interval: 1,
      nextStudyDate: 'invalid-date',
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-02T00:00:00Z'),
    },
  },
  {
    testName: '無効な日付（createdAt）の場合',
    invalidCardLearningState: {
      cardId: 'card123',
      studiedBy: 'user123',
      easeFactor: 2.5,
      interval: 1,
      nextStudyDate: new Date('2023-01-10T00:00:00Z'),
      createdAt: 'invalid-date',
      updatedAt: new Date('2023-01-02T00:00:00Z'),
    },
  },
  {
    testName: '無効な日付（updatedAt）の場合',
    invalidCardLearningState: {
      cardId: 'card123',
      studiedBy: 'user123',
      easeFactor: 2.5,
      interval: 1,
      nextStudyDate: new Date('2023-01-10T00:00:00Z'),
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: 'invalid-date',
    },
  },
  // easeFactorの制約に関するテスト
  {
    testName: 'easeFactorが1.3未満の場合',
    invalidCardLearningState: {
      cardId: 'card123',
      studiedBy: 'user123',
      easeFactor: 1.2, // 1.3未満の値
      interval: 1,
      nextStudyDate: new Date('2023-01-10T00:00:00Z'),
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-02T00:00:00Z'),
    },
  },
  {
    testName: 'easeFactorが境界値（1.3）の場合は有効',
    invalidCardLearningState: {
      cardId: 'card123',
      studiedBy: 'user123',
      easeFactor: 1.3, // 境界値（有効）
      interval: 1,
      nextStudyDate: new Date('2023-01-10T00:00:00Z'),
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-02T00:00:00Z'),
    },
    isValid: true, // この場合は有効なデータ
  },
  // intervalの制約に関するテスト
  {
    testName: 'intervalが負の数の場合',
    invalidCardLearningState: {
      cardId: 'card123',
      studiedBy: 'user123',
      easeFactor: 2.5,
      interval: -1, // 負の値
      nextStudyDate: new Date('2023-01-10T00:00:00Z'),
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-02T00:00:00Z'),
    },
  },
  {
    testName: 'intervalが整数でない場合',
    invalidCardLearningState: {
      cardId: 'card123',
      studiedBy: 'user123',
      easeFactor: 2.5,
      interval: 1.5, // 整数でない値
      nextStudyDate: new Date('2023-01-10T00:00:00Z'),
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-02T00:00:00Z'),
    },
  },
  {
    testName: 'intervalが境界値（0）の場合は有効',
    invalidCardLearningState: {
      cardId: 'card123',
      studiedBy: 'user123',
      easeFactor: 2.5,
      interval: 0, // 境界値（有効）
      nextStudyDate: new Date('2023-01-10T00:00:00Z'),
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-02T00:00:00Z'),
    },
    isValid: true, // この場合は有効なデータ
  },
])('%sにエラーとなること', ({ invalidCardLearningState, isValid = false }) =>
  Effect.gen(function* () {
    expect.assertions(1)
    // Act
    const result = yield* Effect.exit(Schema.validate(CardLearningStateSchema)(invalidCardLearningState))
    // Assert
    if (isValid) {
      if (Exit.isSuccess(result)) {
        expect(result.value).toEqual(invalidCardLearningState)
      }
    } else {
      if (Exit.isFailure(result) && Cause.isFailType(result.cause)) {
        expect(result.cause.error).toBeInstanceOf(ParseError)
      }
    }
  }),
)
