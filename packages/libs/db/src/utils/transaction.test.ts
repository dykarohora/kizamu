import { afterEach, beforeEach, describe, expect, it } from '@effect/vitest'
import { reset, seed } from 'drizzle-seed'
import { Effect, Exit, pipe } from 'effect'
import { uuidv7 } from 'uuidv7'
import { getSetupClient, getTestDriver } from '../../test/setupClient'
import * as cardSchema from '../card/card.sql'
import { createCard } from '../card/createCard'
import { DuplicateCardError } from '../card/error'
import { fetchCardsByDeckId } from '../card/fetchCardsByDeckId'
import * as deckSchema from '../deck/deck.sql'
import { NotFoundDeckError } from '../deck/error'
import * as userSchema from '../user/user.sql'
import { transaction } from './transaction'

// テスト用の定数
const testUserId = uuidv7()
const testDeckId = uuidv7()

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
})

afterEach(async () => {
  await reset(getSetupClient(), {
    ...userSchema,
    ...deckSchema,
    ...cardSchema,
  })
})

describe('transaction', () => {
  // 正常系：トランザクション内の全ての操作が成功した場合コミットされること
  it.effect('正常なEffectを渡した場合にトランザクション内の全てのDB操作がコミットされること', () =>
    pipe(
      Effect.gen(function* () {
        expect.assertions(2)

        // Arrange
        const id1 = uuidv7()
        const id2 = uuidv7()

        // Act
        yield* transaction(
          Effect.gen(function* () {
            // 2つのカードを作成
            yield* createCard({
              card: {
                id: id1,
                deckId: testDeckId,
                frontContent: 'カード1表面',
                backContent: 'カード1裏面',
              },
              createdBy: testUserId,
            })

            yield* createCard({
              card: {
                id: id2,
                deckId: testDeckId,
                frontContent: 'カード2表面',
                backContent: 'カード2裏面',
              },
              createdBy: testUserId,
            })
          }),
        )

        // Assert
        const cards = yield* fetchCardsByDeckId({ deckId: testDeckId })
        // 両方のカードが存在すること
        expect(cards.cards.some((c) => c.id === id1)).toBe(true)
        expect(cards.cards.some((c) => c.id === id2)).toBe(true)
      }),
      Effect.provide(getTestDriver()),
    ),
  )

  // 異常系：トランザクション内で途中の操作が失敗した場合全てロールバックされること
  it.effect('トランザクション内で途中のDB操作が失敗した場合に全ての操作がロールバックされること', () =>
    pipe(
      Effect.gen(function* () {
        expect.assertions(3)

        // Arrange
        const id1 = uuidv7()
        const id2 = id1 // わざと同じIDを使用してエラーを発生させる

        // Act
        const result = yield* Effect.exit(
          transaction(
            Effect.gen(function* () {
              // 1つ目のカードを作成
              yield* createCard({
                card: {
                  id: id1,
                  deckId: testDeckId,
                  frontContent: 'テスト表面1',
                  backContent: 'テスト裏面1',
                },
                createdBy: testUserId,
              })

              // 2つ目は同じIDで作成しようとしてエラーになる
              yield* createCard({
                card: {
                  id: id2, // 同じIDなのでエラー
                  deckId: testDeckId,
                  frontContent: 'テスト表面2',
                  backContent: 'テスト裏面2',
                },
                createdBy: testUserId,
              })
            }),
          ),
        )

        // Assert
        // エラー結果がDuplicateCardErrorであること
        expect(Exit.isFailure(result)).toBe(true)
        if (Exit.isFailure(result) && result.cause._tag === 'Fail') {
          expect(result.cause.error).toBeInstanceOf(DuplicateCardError)
        }

        // 1つ目のカードもロールバックされていること
        const cards = yield* fetchCardsByDeckId({ deckId: testDeckId })
        expect(cards.cards.some((c) => c.id === id1)).toBe(false)
      }),
      Effect.provide(getTestDriver()),
    ),
  )

  // トランザクション内でreturnした値がそのまま返却されること
  it.effect('トランザクション内でreturnした値がそのまま返却されること', () =>
    pipe(
      Effect.gen(function* () {
        expect.assertions(1)

        // Arrange
        const testValue = { key: 'value', num: 123 }

        // Act
        const result = yield* transaction(
          Effect.gen(function* () {
            // ジェネレータを正しく動作させるためのダミーyield
            yield* Effect.succeed(null)
            return testValue
          }),
        )

        // Assert
        expect(result).toEqual(testValue)
      }),
      Effect.provide(getTestDriver()),
    ),
  )

  // トランザクション内でfailしたエラーが外に伝播されること
  it.effect('トランザクション内でfailしたエラーが外に伝播されること', () =>
    pipe(
      Effect.gen(function* () {
        expect.assertions(2)

        // Arrange
        const nonExistentDeckId = uuidv7()
        const testError = new NotFoundDeckError({ deckId: nonExistentDeckId })

        // Act
        const result = yield* Effect.exit(
          transaction(
            Effect.gen(function* () {
              // わざとエラーを発生させる
              return yield* Effect.fail(testError)
            }),
          ),
        )

        // Assert
        expect(Exit.isFailure(result)).toBe(true)
        if (Exit.isFailure(result) && result.cause._tag === 'Fail') {
          expect(result.cause.error).toBeInstanceOf(NotFoundDeckError)
        }
      }),
      Effect.provide(getTestDriver()),
    ),
  )

  // Effect.provideで依存関係を注入した場合に正常に動作すること
  it.effect('Effect.provideで依存関係を注入した場合に正常に動作すること', () =>
    pipe(
      Effect.gen(function* () {
        expect.assertions(1)

        // Arrange
        const id = uuidv7()

        // Act
        // わざとEffectの実行環境を個別に用意する
        const result = yield* Effect.provide(
          transaction(
            Effect.gen(function* () {
              yield* createCard({
                card: {
                  id,
                  deckId: testDeckId,
                  frontContent: 'テスト表面',
                  backContent: 'テスト裏面',
                },
                createdBy: testUserId,
              })
              return true
            }),
          ),
          getTestDriver(),
        )

        // Assert
        expect(result).toBe(true)
      }),
      Effect.provide(getTestDriver()),
    ),
  )
})
