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
import { fetchDecks } from './fetchDecks'

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

// アサーション数: 3
const validatePaginationResult = (
  result: { decks: Deck[]; nextCursor?: string; total: number },
  expectedLength: number,
  shouldHaveNextPage: boolean,
  expectedTotal: number,
) => {
  expect(result.decks).toHaveLength(expectedLength)
  if (shouldHaveNextPage) {
    expect(result.nextCursor).toBeDefined()
  } else {
    expect(result.nextCursor).toBeUndefined()
  }
  expect(result.total).toEqual(expectedTotal)
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

// デッキ一覧の取得に関するテスト
describe('デッキ一覧の取得', () => {
  it.effect('デッキ一覧を正常に取得できること', () =>
    pipe(
      Effect.gen(function* () {
        expect.assertions(7) // 3(validatePaginationResult) + 4(validateDeckStructure)

        // Act
        const result = yield* fetchDecks({ userId: targetUserId })

        // Assert
        validatePaginationResult(result, 20, true, deckCount)
        validateDeckStructure(result.decks[0])
      }),
      Effect.provide(getTestDriver()),
    ),
  )

  it.effect('存在しないユーザーのデッキ一覧を取得した場合は空配列が返ること', () =>
    pipe(
      Effect.gen(function* () {
        expect.assertions(3)
        // Act
        const result = yield* fetchDecks({ userId: uuidv7() })

        // Assert
        validatePaginationResult(result, 0, false, 0)
      }),
      Effect.provide(getTestDriver()),
    ),
  )
})

// ページネーションに関するテスト
describe('ページネーション', () => {
  it.effect('カーソルを指定してデッキ一覧を取得できること', () =>
    pipe(
      Effect.gen(function* () {
        expect.assertions(4)
        // Arrange: 最初のページを取得
        const firstPage = yield* fetchDecks({ userId: targetUserId, limit: 10 })
        const cursor = firstPage.nextCursor

        // Act: 2ページ目を取得
        const secondPage = yield* fetchDecks({
          userId: targetUserId,
          cursor,
          limit: 10,
        })

        // Assert
        validatePaginationResult(secondPage, 10, true, deckCount)
        expect(secondPage.decks[0].id).not.toEqual(firstPage.decks[0].id)
      }),
      Effect.provide(getTestDriver()),
    ),
  )

  it.effect('最後のページを取得した場合はnextCursorがundefinedになること', () =>
    pipe(
      Effect.gen(function* () {
        expect.assertions(4)
        // Arrange: 全件数を取得
        const firstPage = yield* fetchDecks({ userId: targetUserId })
        const totalPages = Math.ceil(firstPage.total / 50)
        let lastPageCursor: string | undefined
        let currentPage = yield* fetchDecks({ userId: targetUserId, limit: 50 })

        // 最後のページまでカーソルを進める
        for (let i = 1; i < totalPages - 1; i++) {
          lastPageCursor = currentPage.nextCursor
          if (lastPageCursor) {
            currentPage = yield* fetchDecks({
              userId: targetUserId,
              cursor: lastPageCursor,
              limit: 50,
            })
          }
        }

        // Act: 最後のページを取得
        const lastPage = yield* fetchDecks({
          userId: targetUserId,
          cursor: currentPage.nextCursor,
          limit: 50,
        })

        // Assert
        expect(lastPage.decks.length).toBeLessThanOrEqual(50)
        expect(lastPage.decks.length).toBeGreaterThan(0)
        expect(lastPage.nextCursor).toBeUndefined()
        expect(lastPage.total).toEqual(firstPage.total)
      }),
      Effect.provide(getTestDriver()),
    ),
  )
})

// 制限値（limit）に関するテスト
describe('制限値の処理', () => {
  it.effect.each([
    ['limitを指定してデッキ一覧を取得できること', { limit: 5, expectedLength: 5 }] as const,
    ['limitの最小値（1）で正しくデッキを取得できること', { limit: 1, expectedLength: 1 }] as const,
    ['limitの最大値（50）で正しくデッキを取得できること', { limit: 50, expectedLength: 50 }] as const,
    ['limitが最大値を超える場合は50件に制限されること', { limit: 100, expectedLength: 50 }] as const,
    ['limitに0を指定した場合はデフォルト値（20件）で取得されること', { limit: 0, expectedLength: 20 }] as const,
    ['limitに負数を指定した場合はデフォルト値（20件）で取得されること', { limit: -10, expectedLength: 20 }] as const,
  ])('%s', ([_, { limit, expectedLength }]) =>
    pipe(
      Effect.gen(function* () {
        expect.assertions(3)
        // Act
        const result = yield* fetchDecks({ userId: targetUserId, limit })

        // Assert
        validatePaginationResult(result, expectedLength, true, deckCount)
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
