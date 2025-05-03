import { afterEach, beforeEach, describe, expect, it } from '@effect/vitest'
import { eq } from 'drizzle-orm'
import { reset, seed } from 'drizzle-seed'
import { Effect, pipe } from 'effect'
import { uuidv7 } from 'uuidv7'
import { getSetupClient, getTestDriver } from '../../test/setupClient'
import * as cardSchema from '../card/card.sql'
import * as userSchema from '../user/user.sql'
import * as deckSchema from './deck.sql'
import { fetchDecks } from './fetchDecks'

// テスト用の定数
const testUserId = uuidv7()
const testDeckId1 = uuidv7()
const testDeckId2 = uuidv7()
const testDeckId3 = uuidv7()

// テスト日付の準備
const yesterday = new Date()
yesterday.setDate(yesterday.getDate() - 1)

const tomorrow = new Date()
tomorrow.setDate(tomorrow.getDate() + 1)

// ヘルパー関数
/**
 * ページネーション結果を検証する（アサーション数: 3）
 */
const validatePaginationResult = (
  result: { decks: unknown[]; nextCursor?: string; total: number },
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

/**
 * デッキのカード情報を検証する（アサーション数: 2）
 */
const validateDeckCardCounts = (
  deck: { id: string; totalCards: number; dueCards: number } | undefined,
  expectedTotal: number,
  expectedDue: number,
) => {
  expect(deck).toBeDefined()
  if (deck) {
    expect(deck.totalCards).toBe(expectedTotal)
    expect(deck.dueCards).toBe(expectedDue)
  }
}

describe('fetchDecks', () => {
  // テストデータのセットアップ
  beforeEach(async () => {
    // ユーザーとデッキの作成
    await seed(getSetupClient(), {
      ...userSchema,
      ...deckSchema,
    }).refine((f) => ({
      usersTable: {
        count: 1,
        columns: {
          id: f.default({ defaultValue: testUserId }),
          name: f.default({ defaultValue: 'テストユーザー' }),
          email: f.default({ defaultValue: 'test@example.com' }),
        },
      },
      decksTable: {
        count: 3,
        columns: {
          id: f.valuesFromArray({ values: [testDeckId1, testDeckId2, testDeckId3], isUnique: true }),
          name: f.valuesFromArray({ values: ['テストデッキ1', 'テストデッキ2', 'テストデッキ3'], isUnique: true }),
          description: f.valuesFromArray({
            values: ['テスト用デッキ1', 'テスト用デッキ2', 'テスト用デッキ3'],
            isUnique: true,
          }),
          createdBy: f.default({ defaultValue: testUserId }),
        },
      },
    }))

    const db = getSetupClient()

    // デッキ1のカード：未学習2枚、期限切れ1枚、期限内1枚（計4枚）
    await db.insert(cardSchema.cardsTable).values([
      {
        id: uuidv7(),
        deckId: testDeckId1,
        frontContent: 'デッキ1-カード1（未学習）',
        backContent: 'デッキ1-カード1の裏面',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv7(),
        deckId: testDeckId1,
        frontContent: 'デッキ1-カード2（未学習）',
        backContent: 'デッキ1-カード2の裏面',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv7(),
        deckId: testDeckId1,
        frontContent: 'デッキ1-カード3（期限切れ）',
        backContent: 'デッキ1-カード3の裏面',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv7(),
        deckId: testDeckId1,
        frontContent: 'デッキ1-カード4（期限内）',
        backContent: 'デッキ1-カード4の裏面',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])

    // デッキ2のカード：未学習1枚、期限切れ1枚、期限内1枚（計3枚）
    const deck2Card1 = {
      id: uuidv7(),
      deckId: testDeckId2,
      frontContent: 'デッキ2-カード1（未学習）',
      backContent: 'デッキ2-カード1の裏面',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const deck2Card2 = {
      id: uuidv7(),
      deckId: testDeckId2,
      frontContent: 'デッキ2-カード2（期限切れ）',
      backContent: 'デッキ2-カード2の裏面',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const deck2Card3 = {
      id: uuidv7(),
      deckId: testDeckId2,
      frontContent: 'デッキ2-カード3（期限内）',
      backContent: 'デッキ2-カード3の裏面',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await db.insert(cardSchema.cardsTable).values([deck2Card1, deck2Card2, deck2Card3])

    // デッキ1のカード学習状態を設定
    const deck1Cards = await db
      .select({ id: cardSchema.cardsTable.id })
      .from(cardSchema.cardsTable)
      .where(eq(cardSchema.cardsTable.deckId, testDeckId1))
      .execute()

    // カード3は期限切れ、カード4は期限内
    const deck1Card3Id = deck1Cards[2].id
    const deck1Card4Id = deck1Cards[3].id

    await db.insert(cardSchema.cardLearningStatesTable).values([
      {
        cardId: deck1Card3Id,
        studiedBy: testUserId,
        easeFactor: 2.5,
        interval: 1,
        nextStudyDate: yesterday, // 期限切れ
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        cardId: deck1Card4Id,
        studiedBy: testUserId,
        easeFactor: 2.5,
        interval: 5,
        nextStudyDate: tomorrow, // 期限内
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])

    // デッキ2のカード学習状態を設定：カード2は期限切れ、カード3は期限内
    await db.insert(cardSchema.cardLearningStatesTable).values([
      {
        cardId: deck2Card2.id,
        studiedBy: testUserId,
        easeFactor: 2.5,
        interval: 1,
        nextStudyDate: yesterday, // 期限切れ
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        cardId: deck2Card3.id,
        studiedBy: testUserId,
        easeFactor: 2.5,
        interval: 5,
        nextStudyDate: tomorrow, // 期限内
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])
  })

  // テストデータの後片付け
  afterEach(async () => {
    await reset(getSetupClient(), {
      ...userSchema,
      ...deckSchema,
      ...cardSchema,
    })
  })

  // 基本的な取得機能のテスト
  describe('基本機能', () => {
    // デッキとカード情報を正しく取得できること
    it.effect('デッキとカード情報を正しく取得できること', () =>
      pipe(
        Effect.gen(function* () {
          expect.assertions(9)

          // Act
          const result = yield* fetchDecks({
            userId: testUserId,
          })

          // Assert
          // 3つのデッキが取得できること
          expect(result.decks).toHaveLength(3)
          expect(result.total).toBe(3)
          expect(result.nextCursor).toBeUndefined()

          // デッキ1: 全4枚のカード、うち学習対象は3枚（未学習2枚+期限切れ1枚）
          const deck1 = result.decks.find((deck) => deck.id === testDeckId1)
          validateDeckCardCounts(deck1, 4, 3)

          // デッキ2: 全3枚のカード、うち学習対象は2枚（未学習1枚+期限切れ1枚）
          const deck2 = result.decks.find((deck) => deck.id === testDeckId2)
          validateDeckCardCounts(deck2, 3, 2)
        }),
        Effect.provide(getTestDriver()),
      ),
    )

    // 存在しないユーザーのデッキ一覧を取得した場合は空配列が返ること
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

  // ページネーション機能のテスト
  describe('ページネーション', () => {
    // 制限値を指定した場合、指定した数のデッキのみを取得できること
    it.effect('制限値を指定した場合、指定した数のデッキのみを取得できること', () =>
      pipe(
        Effect.gen(function* () {
          expect.assertions(3)

          // Act
          const result = yield* fetchDecks({
            userId: testUserId,
            limit: 2,
          })

          // Assert
          validatePaginationResult(result, 2, true, 3)
        }),
        Effect.provide(getTestDriver()),
      ),
    )

    // カーソルを指定した場合、カーソル以降のデッキを取得できること
    it.effect('カーソルを指定した場合、カーソル以降のデッキを取得できること', () =>
      pipe(
        Effect.gen(function* () {
          expect.assertions(3)

          // まず1回目のクエリを実行して次のカーソルを取得
          const firstResult = yield* fetchDecks({
            userId: testUserId,
            limit: 1,
          })

          const cursor = firstResult.nextCursor

          // カーソルを使って2回目のクエリを実行
          const result = yield* fetchDecks({
            userId: testUserId,
            cursor,
          })

          // Assert
          expect(result.decks).toHaveLength(2)
          expect(result.decks[0].id).not.toBe(firstResult.decks[0].id)
          expect(result.total).toBe(3)
        }),
        Effect.provide(getTestDriver()),
      ),
    )

    // 最後のページを取得した場合はnextCursorがundefinedになること
    it.effect('最後のページを取得した場合はnextCursorがundefinedになること', () =>
      pipe(
        Effect.gen(function* () {
          expect.assertions(3)

          // 3つのデッキがあるので、limit=2で1ページ目を取得すると、nextCursorが存在する
          const firstPage = yield* fetchDecks({
            userId: testUserId,
            limit: 2,
          })

          // 2ページ目を取得する（残り1件なので、nextCursorはundefinedになるはず）
          const secondPage = yield* fetchDecks({
            userId: testUserId,
            cursor: firstPage.nextCursor,
            limit: 2,
          })

          // Assert
          expect(secondPage.decks.length).toBe(1)
          expect(secondPage.nextCursor).toBeUndefined()
          expect(secondPage.total).toBe(3)
        }),
        Effect.provide(getTestDriver()),
      ),
    )
  })

  // 制限値（limit）に関するテスト
  describe('制限値の処理', () => {
    it.effect.each([
      ['limitに0を指定した場合はデフォルト値（20件）で取得されること', { limit: 0, expectedLength: 3 }] as const,
      ['limitに負数を指定した場合はデフォルト値（20件）で取得されること', { limit: -10, expectedLength: 3 }] as const,
      ['limitの最小値（1）で正しくデッキを取得できること', { limit: 1, expectedLength: 1 }] as const,
    ])('%s', ([_, { limit, expectedLength }]) =>
      pipe(
        Effect.gen(function* () {
          expect.assertions(3)

          // Act
          const result = yield* fetchDecks({ userId: testUserId, limit })

          // Assert
          validatePaginationResult(result, expectedLength, expectedLength < 3, 3)
        }),
        Effect.provide(getTestDriver()),
      ),
    )
  })
})
