import { afterEach, beforeEach, describe, expect, it } from '@effect/vitest'
import { reset, seed } from 'drizzle-seed'
import { Effect, Exit, pipe } from 'effect'
import { uuidv7 } from 'uuidv7'
import { getSetupClient, getTestDriver } from '../../test/setupClient'
import * as deckSchema from '../deck/deck.sql'
import * as userSchema from '../user/user.sql'
import * as cardSchema from './card.sql'
import { fetchCardById } from './fetchCardById'
import { NotFoundCardError } from './error'

// テスト用の定数
const testUserId = uuidv7()
const testDeckId = uuidv7()
const testCardId = uuidv7()
const nonExistentCardId = uuidv7()

// テストデータのセットアップ
beforeEach(async () => {
  await seed(getSetupClient(), {
    ...userSchema,
    ...deckSchema,
  }).refine((f) => ({
    // ユーザーデータ
    usersTable: {
      count: 1,
      columns: {
        id: f.default({ defaultValue: testUserId }),
        name: f.default({ defaultValue: 'テストユーザー' }),
        email: f.default({ defaultValue: 'test@example.com' }),
      },
    },

    // デッキデータ
    decksTable: {
      count: 1,
      columns: {
        id: f.default({ defaultValue: testDeckId }),
        name: f.default({ defaultValue: 'テストデッキ' }),
        description: f.default({ defaultValue: 'テスト用デッキ' }),
        createdBy: f.default({ defaultValue: testUserId }),
      },
    },
  }))

  const db = getSetupClient()

  // カードデータを挿入
  await db.insert(cardSchema.cardsTable).values({
    id: testCardId,
    deckId: testDeckId,
    createdBy: testUserId,
    frontContent: 'テスト表面',
    backContent: 'テスト裏面',
    createdAt: new Date(),
    updatedAt: new Date(),
  })
})

afterEach(async () => {
  await reset(getSetupClient(), {
    ...userSchema,
    ...deckSchema,
    ...cardSchema,
  })
})

describe('fetchCardById', () => {
  // 存在するカードIDが与えられた場合に、カード情報が正常に取得できること
  it.effect('存在するカードIDが与えられた場合に、カード情報が正常に取得できること', () =>
    pipe(
      Effect.gen(function* () {
        expect.assertions(8)

        // Act
        const card = yield* fetchCardById(testCardId)

        // Assert
        expect(card.id).toEqual(testCardId)
        expect(card.deckId).toEqual(testDeckId)
        expect(card.frontContent).toEqual('テスト表面')
        expect(card.backContent).toEqual('テスト裏面')
        expect(card.createdBy.id).toEqual(testUserId)
        expect(card.createdBy.name).toEqual('テストユーザー')
        expect(card.createdAt).toBeInstanceOf(Date)
        expect(card.updatedAt).toBeInstanceOf(Date)
      }),
      Effect.provide(getTestDriver()),
    ),
  )

  // 存在しないカードIDが与えられた場合に、NotFoundCardErrorが返されること
  it.effect('存在しないカードIDが与えられた場合に、NotFoundCardErrorが返されること', () =>
    pipe(
      Effect.gen(function* () {
        expect.assertions(2)

        // Act & Assert
        const result = yield* Effect.exit(fetchCardById(nonExistentCardId))

        if (Exit.isFailure(result) && result.cause._tag === 'Fail') {
          expect(result.cause.error).toBeInstanceOf(NotFoundCardError)
          if (result.cause.error instanceof NotFoundCardError) {
            expect(result.cause.error.cardId).toEqual(nonExistentCardId)
          }
        }
      }),
      Effect.provide(getTestDriver()),
    ),
  )
})
