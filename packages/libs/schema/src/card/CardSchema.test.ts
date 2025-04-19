import { expect, it } from '@effect/vitest'
import { Cause, Effect, Exit, Schema } from 'effect'
import { ParseError } from 'effect/ParseResult'
import { CardSchema } from './CardSchema'

it.effect('有効なカードデータが検証を通過すること', () =>
  Effect.gen(function* () {
    expect.assertions(1)
    // Arrange
    const validCard = {
      id: 'card123',
      deckId: 'deck123',
      frontContent: 'これは表面の内容です',
      backContent: 'これは裏面の内容です',
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-02T00:00:00Z'),
    } as const
    // Act
    const result = yield* Schema.validate(CardSchema)(validCard)
    // Assert
    expect(result).toEqual(validCard)
  }),
)

// 異常系のテストケースをパラメータ化
it.effect.each([
  {
    testName: '必須フィールド（id）が欠けている場合',
    invalidCard: {
      deckId: 'deck123',
      frontContent: 'これは表面の内容です',
      backContent: 'これは裏面の内容です',
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-02T00:00:00Z'),
    },
  },
  {
    testName: '必須フィールド（deckId）が欠けている場合',
    invalidCard: {
      id: 'card123',
      frontContent: 'これは表面の内容です',
      backContent: 'これは裏面の内容です',
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-02T00:00:00Z'),
    },
  },
  {
    testName: '必須フィールド（frontContent）が欠けている場合',
    invalidCard: {
      id: 'card123',
      deckId: 'deck123',
      backContent: 'これは裏面の内容です',
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-02T00:00:00Z'),
    },
  },
  {
    testName: '必須フィールド（backContent）が欠けている場合',
    invalidCard: {
      id: 'card123',
      deckId: 'deck123',
      frontContent: 'これは表面の内容です',
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-02T00:00:00Z'),
    },
  },
  {
    testName: '必須フィールド（createdAt）が欠けている場合',
    invalidCard: {
      id: 'card123',
      deckId: 'deck123',
      frontContent: 'これは表面の内容です',
      backContent: 'これは裏面の内容です',
      updatedAt: new Date('2023-01-02T00:00:00Z'),
    },
  },
  {
    testName: '必須フィールド（updatedAt）が欠けている場合',
    invalidCard: {
      id: 'card123',
      deckId: 'deck123',
      frontContent: 'これは表面の内容です',
      backContent: 'これは裏面の内容です',
      createdAt: new Date('2023-01-01T00:00:00Z'),
    },
  },
  {
    testName: '空文字列のフィールド（id）の場合',
    invalidCard: {
      id: '',
      deckId: 'deck123',
      frontContent: 'これは表面の内容です',
      backContent: 'これは裏面の内容です',
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-02T00:00:00Z'),
    },
  },
  {
    testName: '空文字列のフィールド（deckId）の場合',
    invalidCard: {
      id: 'card123',
      deckId: '',
      frontContent: 'これは表面の内容です',
      backContent: 'これは裏面の内容です',
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-02T00:00:00Z'),
    },
  },
  {
    testName: '空文字列のフィールド（frontContent）の場合',
    invalidCard: {
      id: 'card123',
      deckId: 'deck123',
      frontContent: '',
      backContent: 'これは裏面の内容です',
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-02T00:00:00Z'),
    },
  },
  {
    testName: '空文字列のフィールド（backContent）の場合',
    invalidCard: {
      id: 'card123',
      deckId: 'deck123',
      frontContent: 'これは表面の内容です',
      backContent: '',
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-02T00:00:00Z'),
    },
  },
  {
    testName: '無効な日付（createdAt）の場合',
    invalidCard: {
      id: 'card123',
      deckId: 'deck123',
      frontContent: 'これは表面の内容です',
      backContent: 'これは裏面の内容です',
      createdAt: 'invalid-date',
      updatedAt: new Date('2023-01-02T00:00:00Z'),
    },
  },
  {
    testName: '無効な日付（updatedAt）の場合',
    invalidCard: {
      id: 'card123',
      deckId: 'deck123',
      frontContent: 'これは表面の内容です',
      backContent: 'これは裏面の内容です',
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: 'invalid-date',
    },
  },
])('%sにエラーとなること', ({ invalidCard }) =>
  Effect.gen(function* () {
    expect.assertions(1)
    // Act
    const result = yield* Effect.exit(Schema.validate(CardSchema)(invalidCard))
    // Assert
    if (Exit.isFailure(result) && Cause.isFailType(result.cause)) {
      expect(result.cause.error).toBeInstanceOf(ParseError)
    }
  }),
)
