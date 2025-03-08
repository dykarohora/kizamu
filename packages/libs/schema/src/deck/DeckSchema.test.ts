import { expect, it } from '@effect/vitest'
import { Cause, Effect, Exit, Schema } from 'effect'
import { ParseError } from 'effect/ParseResult'
import { DeckSchema } from './index'

it.effect('有効なデッキデータが検証を通過すること', () =>
  Effect.gen(function* () {
    expect.assertions(1)
    // Arrange
    const validDeck = {
      id: 'deck123',
      name: 'テストデッキ',
      description: 'これはテスト用のデッキです',
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-02T00:00:00Z'),
    } as const
    // Act
    const result = yield* Schema.validate(DeckSchema)(validDeck)
    // Assert
    expect(result).toEqual(validDeck)
  }),
)

// 異常系のテストケースをパラメータ化
it.effect.each([
  {
    testName: '必須フィールド（id）が欠けている場合',
    invalidDeck: {
      name: 'テストデッキ',
      description: 'これはテスト用のデッキです',
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-02T00:00:00Z'),
    },
  },
  {
    testName: '必須フィールド（name）が欠けている場合',
    invalidDeck: {
      id: 'deck123',
      description: 'これはテスト用のデッキです',
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-02T00:00:00Z'),
    },
  },
  {
    testName: '必須フィールド（description）が欠けている場合',
    invalidDeck: {
      id: 'deck123',
      name: 'テストデッキ',
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-02T00:00:00Z'),
    },
  },
  {
    testName: '必須フィールド（createdAt）が欠けている場合',
    invalidDeck: {
      id: 'deck123',
      name: 'テストデッキ',
      description: 'これはテスト用のデッキです',
      updatedAt: new Date('2023-01-02T00:00:00Z'),
    },
  },
  {
    testName: '必須フィールド（updatedAt）が欠けている場合',
    invalidDeck: {
      id: 'deck123',
      name: 'テストデッキ',
      description: 'これはテスト用のデッキです',
      createdAt: new Date('2023-01-01T00:00:00Z'),
    },
  },
  {
    testName: '空文字列のフィールド（id）の場合',
    invalidDeck: {
      id: '',
      name: 'テストデッキ',
      description: 'これはテスト用のデッキです',
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-02T00:00:00Z'),
    },
  },
  {
    testName: '空文字列のフィールド（name）の場合',
    invalidDeck: {
      id: 'deck123',
      name: '',
      description: 'これはテスト用のデッキです',
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-02T00:00:00Z'),
    },
  },
  {
    testName: '空文字列のフィールド（description）の場合',
    invalidDeck: {
      id: 'deck123',
      name: 'テストデッキ',
      description: '',
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-02T00:00:00Z'),
    },
  },
  {
    testName: '無効な日付（createdAt）の場合',
    invalidDeck: {
      id: 'deck123',
      name: 'テストデッキ',
      description: 'これはテスト用のデッキです',
      createdAt: 'invalid-date',
      updatedAt: new Date('2023-01-02T00:00:00Z'),
    },
  },
  {
    testName: '無効な日付（updatedAt）の場合',
    invalidDeck: {
      id: 'deck123',
      name: 'テストデッキ',
      description: 'これはテスト用のデッキです',
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: 'invalid-date',
    },
  },
])('%sにエラーとなること', ({ invalidDeck }) =>
  Effect.gen(function* () {
    expect.assertions(1)
    // Act
    const result = yield* Effect.exit(Schema.validate(DeckSchema)(invalidDeck))
    // Assert
    if (Exit.isFailure(result) && Cause.isFailType(result.cause)) {
      expect(result.cause.error).toBeInstanceOf(ParseError)
    }
  }),
)
