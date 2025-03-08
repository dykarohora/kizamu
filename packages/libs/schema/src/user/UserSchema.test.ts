import { expect, it } from '@effect/vitest'
import { Cause, Effect, Exit, Schema } from 'effect'
import { ParseError } from 'effect/ParseResult'
import { UserSchema } from './index'

it.effect('有効なユーザーデータが検証を通過すること', () =>
  Effect.gen(function* () {
    expect.assertions(1)
    // Arrange
    const validUser = {
      id: 'user123',
      name: 'テストユーザー',
    } as const
    // Act
    const result = yield* Schema.validate(UserSchema)(validUser)
    // Assert
    expect(result).toEqual(validUser)
  }),
)

// 異常系のテストケースをパラメータ化
it.effect.each([
  {
    testName: '必須フィールド（id）が欠けている場合',
    invalidUser: {
      name: 'テストユーザー',
    },
  },
  {
    testName: '必須フィールド（name）が欠けている場合',
    invalidUser: {
      id: 'user123',
    },
  },
  {
    testName: '空文字列のフィールド（id）の場合',
    invalidUser: {
      id: '',
      name: 'テストユーザー',
    },
  },
  {
    testName: '空文字列のフィールド（name）の場合',
    invalidUser: {
      id: 'user123',
      name: '',
    },
  },
])('%sにエラーとなること', ({ invalidUser }) =>
  Effect.gen(function* () {
    expect.assertions(1)
    // Act
    const result = yield* Effect.exit(Schema.validate(UserSchema)(invalidUser))
    // Assert
    if (Exit.isFailure(result) && Cause.isFailType(result.cause)) {
      expect(result.cause.error).toBeInstanceOf(ParseError)
    }
  }),
)
