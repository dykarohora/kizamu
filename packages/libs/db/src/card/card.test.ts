import { afterEach, beforeEach, describe, expect, it } from '@effect/vitest'
import type { Card } from '@kizamu/schema'
import { reset, seed } from 'drizzle-seed'
import { Effect, Exit, pipe } from 'effect'
import { uuidv7 } from 'uuidv7'
import { getSetupClient, getTestDriver } from '../../test/setupClient'
import * as deckSchema from '../deck/deck.sql'
import { NotFoundDeckError } from '../deck/error'
import { NotFoundUserError } from '../user/error'
import * as userSchema from '../user/user.sql'
import * as cardSchema from './card.sql'
import { createCard } from './createCard'
import { DuplicateCardError } from './error'
import { fetchCardsByDeckId } from './fetchCardsByDeckId'

// テスト用の定数
const targetUserId = uuidv7()
const targetDeckId = uuidv7()

const cardCount = 100
const targetCardIds = Array.from({ length: cardCount }, () => uuidv7())
const targetCardId = targetCardIds[0]

// ヘルパー関数
// アサーション数: 4
const validateCardStructure = (card: Card) => {
  expect(card.id).toBeDefined()
  expect(card.deckId).toBeDefined()
  expect(card.createdAt).toBeInstanceOf(Date)
  expect(card.updatedAt).toBeInstanceOf(Date)
}

// アサーション数: 3
const validatePaginationResult = (
  result: { cards: Card[]; nextCursor?: string; total: number },
  expectedLength: number,
  shouldHaveNextPage: boolean,
  expectedTotal: number,
) => {
  expect(result.cards).toHaveLength(expectedLength)
  if (shouldHaveNextPage) {
    expect(result.nextCursor).toBeDefined()
  } else {
    expect(result.nextCursor).toBeUndefined()
  }
  expect(result.total).toEqual(expectedTotal)
}

// テストデータのセットアップ
beforeEach(async () => {
  await seed(getSetupClient(), {
    ...userSchema,
    ...deckSchema,
    cardsTable: cardSchema.cardsTable,
    cardLearningStatesTable: cardSchema.cardLearningStatesTable,
  }).refine((f) => ({
    usersTable: {
      count: 1,
      columns: {
        id: f.default({ defaultValue: targetUserId }),
        name: f.default({ defaultValue: 'テストユーザー' }),
      },
    },
    decksTable: {
      count: 1,
      columns: {
        id: f.default({ defaultValue: targetDeckId }),
        name: f.default({ defaultValue: 'テストデッキ' }),
      },
    },
    cardsTable: {
      count: cardCount,
      columns: {
        id: f.valuesFromArray({
          values: targetCardIds,
          isUnique: true,
        }),
        deckId: f.default({ defaultValue: targetDeckId }),
      },
    },
    cardLearningStatesTable: {
      count: cardCount,
      columns: {
        cardId: f.valuesFromArray({ values: targetCardIds, isUnique: true }),
        studiedBy: f.default({ defaultValue: targetUserId }),
      },
    },
  }))
})

afterEach(async () => {
  await reset(getSetupClient(), { ...userSchema, ...deckSchema, ...cardSchema })
})

// カードの作成に関するテスト
describe('カードの作成', () => {
  it.effect('新しいカードを正常に作成できること', () =>
    pipe(
      Effect.gen(function* () {
        expect.assertions(6) // 2 + 4(validateCardStructure)

        // Arrange
        const newCardId = uuidv7()
        const createCardInput = {
          card: {
            id: newCardId,
            deckId: targetDeckId,
            frontContent: 'テスト表面',
            backContent: 'テスト裏面',
          },
          createdBy: targetUserId,
        }

        // Act
        const result = yield* createCard(createCardInput)

        // Assert
        expect(result.frontContent).toEqual('テスト表面')
        expect(result.backContent).toEqual('テスト裏面')
        validateCardStructure(result)
      }),
      Effect.provide(getTestDriver()),
    ),
  )

  it.effect('存在しないデッキIDでカードを作成しようとするとNotFoundDeckErrorが発生すること', () =>
    pipe(
      Effect.gen(function* () {
        expect.assertions(2)
        // Arrange
        const nonExistentDeckId = uuidv7()
        const createCardInput = {
          card: {
            id: uuidv7(),
            deckId: nonExistentDeckId,
            frontContent: 'テスト表面',
            backContent: 'テスト裏面',
          },
          createdBy: targetUserId,
        }

        // Act & Assert
        const result = yield* Effect.exit(createCard(createCardInput))

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

  it.effect('存在しないユーザーIDでカードを作成しようとするとNotFoundUserErrorが発生すること', () =>
    pipe(
      Effect.gen(function* () {
        expect.assertions(2)
        // Arrange
        const nonExistentUserId = uuidv7()
        const createCardInput = {
          card: {
            id: uuidv7(),
            deckId: targetDeckId,
            frontContent: 'テスト表面',
            backContent: 'テスト裏面',
          },
          createdBy: nonExistentUserId,
        }

        // Act & Assert
        const result = yield* Effect.exit(createCard(createCardInput))

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

  it.effect('既存のカードIDで作成しようとするとDuplicateCardErrorが発生すること', () =>
    pipe(
      Effect.gen(function* () {
        expect.assertions(2)
        // Arrange
        const createCardInput = {
          card: {
            id: targetCardId,
            deckId: targetDeckId,
            frontContent: '重複カード表面',
            backContent: '重複カード裏面',
          },
          createdBy: targetUserId,
        }

        // Act & Assert
        const result = yield* Effect.exit(createCard(createCardInput))

        if (Exit.isFailure(result) && result.cause._tag === 'Fail') {
          expect(result.cause.error).toBeInstanceOf(DuplicateCardError)
          if (result.cause.error instanceof DuplicateCardError) {
            expect(result.cause.error.cardId).toEqual(targetCardId)
          }
        }
      }),
      Effect.provide(getTestDriver()),
    ),
  )
})

// カード一覧の取得に関するテスト
describe('カード一覧の取得', () => {
  it.effect('指定したデッキIDに属するカードが正しく取得できること', () =>
    pipe(
      Effect.gen(function* () {
        expect.assertions(7) // 3(validatePaginationResult) + 4(validateCardStructure)

        // Act
        const result = yield* fetchCardsByDeckId({ deckId: targetDeckId })

        // Assert
        validatePaginationResult(result, 20, true, cardCount)
        validateCardStructure(result.cards[0])
      }),
      Effect.provide(getTestDriver()),
    ),
  )

  it.effect('存在しないデッキIDを指定した場合は空配列が返ること', () =>
    pipe(
      Effect.gen(function* () {
        expect.assertions(3)
        // Act
        const result = yield* fetchCardsByDeckId({ deckId: uuidv7() })

        // Assert
        validatePaginationResult(result, 0, false, 0)
      }),
      Effect.provide(getTestDriver()),
    ),
  )
})

// ページネーションに関するテスト
describe('カード一覧のページネーション', () => {
  it.effect('カーソルを指定してカード一覧を取得できること', () =>
    pipe(
      Effect.gen(function* () {
        expect.assertions(4)
        // Arrange: 最初のページを取得
        const firstPage = yield* fetchCardsByDeckId({ deckId: targetDeckId, limit: 10 })
        const cursor = firstPage.nextCursor

        // Act: 2ページ目を取得
        const secondPage = yield* fetchCardsByDeckId({
          deckId: targetDeckId,
          cursor,
          limit: 10,
        })

        // Assert
        validatePaginationResult(secondPage, 10, true, cardCount)
        expect(secondPage.cards[0].id).not.toEqual(firstPage.cards[0].id)
      }),
      Effect.provide(getTestDriver()),
    ),
  )

  it.effect('最後のページを取得した場合はnextCursorがundefinedになること', () =>
    pipe(
      Effect.gen(function* () {
        expect.assertions(4)
        // Arrange: 全件数を取得
        const firstPage = yield* fetchCardsByDeckId({ deckId: targetDeckId })
        const totalPages = Math.ceil(firstPage.total / 50)
        let lastPageCursor: string | undefined
        let currentPage = yield* fetchCardsByDeckId({ deckId: targetDeckId, limit: 50 })

        // 最後のページまでカーソルを進める
        for (let i = 1; i < totalPages - 1; i++) {
          lastPageCursor = currentPage.nextCursor
          if (lastPageCursor) {
            currentPage = yield* fetchCardsByDeckId({
              deckId: targetDeckId,
              cursor: lastPageCursor,
              limit: 50,
            })
          }
        }

        // Act: 最後のページを取得
        const lastPage = yield* fetchCardsByDeckId({
          deckId: targetDeckId,
          cursor: currentPage.nextCursor,
          limit: 50,
        })

        // Assert
        expect(lastPage.cards.length).toBeLessThanOrEqual(50)
        expect(lastPage.cards.length).toBeGreaterThan(0)
        expect(lastPage.nextCursor).toBeUndefined()
        expect(lastPage.total).toEqual(firstPage.total)
      }),
      Effect.provide(getTestDriver()),
    ),
  )
})

// 制限値（limit）に関するテスト
describe('カード一覧の制限値処理', () => {
  it.effect.each([
    ['limitを指定してカード一覧を取得できること', { limit: 5, expectedLength: 5 }] as const,
    ['limitの最小値（1）で正しくカードを取得できること', { limit: 1, expectedLength: 1 }] as const,
    ['limitの最大値（50）で正しくカードを取得できること', { limit: 50, expectedLength: 50 }] as const,
    ['limitが最大値を超える場合は50件に制限されること', { limit: 100, expectedLength: 50 }] as const,
    ['limitに0を指定した場合はデフォルト値（20件）で取得されること', { limit: 0, expectedLength: 20 }] as const,
    ['limitに負数を指定した場合はデフォルト値（20件）で取得されること', { limit: -10, expectedLength: 20 }] as const,
  ])('%s', ([_, { limit, expectedLength }]) =>
    pipe(
      Effect.gen(function* () {
        expect.assertions(3)
        // Act
        const result = yield* fetchCardsByDeckId({ deckId: targetDeckId, limit })

        // Assert
        validatePaginationResult(result, expectedLength, expectedLength < cardCount, cardCount)
      }),
      Effect.provide(getTestDriver()),
    ),
  )
})
