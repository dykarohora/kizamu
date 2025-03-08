import { afterEach, beforeEach, expect, it } from '@effect/vitest'
import { reset, seed } from 'drizzle-seed'
import { Effect, Exit, pipe } from 'effect'
import { uuidv7 } from 'uuidv7'
import { getSetupClient, getTestDriver } from '../../test/setupClient'
import * as deckSchema from './deck.sql'
import * as userSchema from '../user/user.sql'
import { createDeck } from './createDeck'
import { DuplicateDeckError } from './error'
import { NotFoundUserError } from '../user/error'

const targetUserId = uuidv7()
const targetDeckId = uuidv7()

beforeEach(async () => {
  const client = getSetupClient()
  // ユーザーデータのシード
  await seed(client, { ...userSchema, ...deckSchema }).refine((f) => ({
    usersTable: {
      count: 1,
      columns: {
        id: f.valuesFromArray({
          values: [targetUserId],
          isUnique: true,
        }),
        name: f.default({ defaultValue: 'テストユーザー' }),
      },
    },
  }))

  // デッキ重複テスト用のデータをシード
  await seed(client, deckSchema).refine((f) => ({
    decksTable: {
      count: 1,
      columns: {
        id: f.valuesFromArray({
          values: [targetDeckId],
          isUnique: true,
        }),
        name: f.default({ defaultValue: '既存のデッキ' }),
        description: f.default({ defaultValue: '既存のデッキの説明' }),
        createdBy: f.valuesFromArray({
          values: [targetUserId],
          isUnique: false,
        }),
      },
    },
  }))
})

afterEach(async () => {
  const client = getSetupClient()
  await reset(client, deckSchema)
  await reset(client, userSchema)
})

it.effect('新しいデッキを正常に作成できること', () =>
  pipe(
    Effect.gen(function* () {
      expect.assertions(7)
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
      expect(result.createdBy.id).toEqual(targetUserId)
      expect(result.createdBy.name).toEqual('テストユーザー')
      expect(result.createdAt).toBeInstanceOf(Date)
      expect(result.updatedAt).toBeInstanceOf(Date)
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
        id: targetDeckId, // 既に存在するID
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
