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

// テスト用の定数
const targetUserId = uuidv7()
const targetDeckId = uuidv7()

const cardCount = 10
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
      count: 10,
      columns: {
        id: f.valuesFromArray({
          values: targetCardIds,
          isUnique: true,
        }),
        deckId: f.default({ defaultValue: targetDeckId }),
      },
    },
    cardLearningStatesTable: {
      count: 10,
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
