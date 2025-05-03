import { afterEach, beforeEach, describe, expect, it } from '@effect/vitest'
import type { Deck } from '@kizamu/schema'
import { reset, seed } from 'drizzle-seed'
import { Effect, Exit, pipe } from 'effect'
import { uuidv7 } from 'uuidv7'
import { getSetupClient, getTestDriver } from '../../test/setupClient'
import { NotFoundUserError } from '../user/error'
import * as userSchema from '../user/user.sql'
import { createDeck } from './createDeck'
import * as deckSchema from './deck.sql'
import { DuplicateDeckError } from './error'
import { NotFoundDeckError } from './error'
import { fetchDeckById } from './fetchDeckById'

// テスト用の定数
const targetUserId = uuidv7()
const targetDeckId = uuidv7()
const deckCount = 100

// ヘルパー関数
// アサーション数: 4
const validateDeckStructure = (deck: Deck) => {
  expect(deck.id).toBeDefined()
  expect(deck.createdBy).toEqual({
    id: targetUserId,
    name: 'テストユーザー',
  })
  expect(deck.createdAt).toBeInstanceOf(Date)
  expect(deck.updatedAt).toBeInstanceOf(Date)
}

// テストデータのセットアップ
beforeEach(async () => {
  await seed(getSetupClient(), { ...userSchema, ...deckSchema }).refine((f) => ({
    usersTable: {
      count: 1,
      columns: {
        id: f.default({ defaultValue: targetUserId }),
        name: f.default({ defaultValue: 'テストユーザー' }),
      },
    },
    decksTable: {
      count: deckCount,
      columns: {
        id: f.valuesFromArray({
          values: [targetDeckId, ...Array.from({ length: deckCount - 1 }, () => uuidv7())],
          isUnique: true,
        }),
      },
    },
  }))
})

afterEach(async () => {
  await reset(getSetupClient(), { ...userSchema, ...deckSchema })
})

// デッキの作成に関するテスト
describe('デッキの作成', () => {
  it.effect('新しいデッキを正常に作成できること', () =>
    pipe(
      Effect.gen(function* () {
        expect.assertions(7) // 3 + 4(validateDeckStructure)

        // Arrange
        const newDeckId = uuidv7()
        const newDeck = {
          id: newDeckId,
          name: 'テストデッキ',
          description: 'テスト用のデッキです',
          createdBy: targetUserId,
        }

        // Act
        const result = yield* createDeck(newDeck)

        // Assert
        expect(result.id).toEqual(newDeckId)
        expect(result.name).toEqual('テストデッキ')
        expect(result.description).toEqual('テスト用のデッキです')
        validateDeckStructure(result)
      }),
      Effect.provide(getTestDriver()),
    ),
  )

  it.effect('存在しないユーザーIDでデッキを作成しようとするとNotFoundUserErrorが発生すること', () =>
    pipe(
      Effect.gen(function* () {
        expect.assertions(2)
        // Arrange
        const nonExistentUserId = uuidv7()
        const newDeck = {
          id: uuidv7(),
          name: 'テストデッキ',
          description: 'テスト用のデッキです',
          createdBy: nonExistentUserId,
        }

        // Act & Assert
        const result = yield* Effect.exit(createDeck(newDeck))

        if (Exit.isFailure(result) && result.cause._tag === 'Fail') {
          expect(result.cause.error).toBeInstanceOf(NotFoundUserError)
          if (result.cause.error instanceof NotFoundUserError) {
            expect(result.cause.error.userId).toEqual(nonExistentUserId)
          }
        }
      }),
      Effect.provide(getTestDriver()),
    ),
  )

  it.effect('既存のデッキIDで作成しようとするとDuplicateDeckErrorが発生すること', () =>
    pipe(
      Effect.gen(function* () {
        expect.assertions(2)
        // Arrange
        const duplicateDeck = {
          id: targetDeckId,
          name: '重複デッキ',
          description: '重複するデッキの説明',
          createdBy: targetUserId,
        }

        // Act & Assert
        const result = yield* Effect.exit(createDeck(duplicateDeck))

        if (Exit.isFailure(result) && result.cause._tag === 'Fail') {
          expect(result.cause.error).toBeInstanceOf(DuplicateDeckError)
          if (result.cause.error instanceof DuplicateDeckError) {
            expect(result.cause.error.deckId).toEqual(targetDeckId)
          }
        }
      }),
      Effect.provide(getTestDriver()),
    ),
  )
})

// デッキの取得に関するテスト
describe('デッキの取得', () => {
  it.effect('指定したIDのデッキを正常に取得できること', () =>
    pipe(
      Effect.gen(function* () {
        expect.assertions(6) // 2 + 4(validateDeckStructure)

        // Act
        const result = yield* fetchDeckById(targetDeckId)

        // Assert
        expect(result.id).toEqual(targetDeckId)
        expect(result.name).toBeDefined()
        validateDeckStructure(result)
      }),
      Effect.provide(getTestDriver()),
    ),
  )

  it.effect('存在しないデッキIDを指定した場合はNotFoundDeckErrorが発生すること', () =>
    pipe(
      Effect.gen(function* () {
        expect.assertions(2)

        // Arrange
        const nonExistentDeckId = uuidv7()

        // Act & Assert
        const result = yield* Effect.exit(fetchDeckById(nonExistentDeckId))

        if (Exit.isFailure(result) && result.cause._tag === 'Fail') {
          expect(result.cause.error).toBeInstanceOf(NotFoundDeckError)
          if (result.cause.error instanceof NotFoundDeckError) {
            expect(result.cause.error.deckId).toEqual(nonExistentDeckId)
          }
        }
      }),
      Effect.provide(getTestDriver()),
    ),
  )
})
