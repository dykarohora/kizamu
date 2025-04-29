import { afterEach, beforeEach, describe, expect, it } from '@effect/vitest'
import type { Card } from '@kizamu/schema'
import { addDays, subDays } from 'date-fns'
import { reset, seed } from 'drizzle-seed'
import { Effect, pipe } from 'effect'
import { uuidv7 } from 'uuidv7'
import { getSetupClient, getTestDriver } from '../../test/setupClient'
import * as deckSchema from '../deck/deck.sql'
import * as userSchema from '../user/user.sql'
import * as cardSchema from './card.sql'
import { fetchDueCards } from './fetchDueCards'

// テスト用の定数
const testUserId = uuidv7()
const testDeckId1 = uuidv7()
const testDeckId2 = uuidv7()

// テスト用カードデータの作成ヘルパー関数
const createTestCard = (
  id: string,
  deckId: string,
  {
    frontSuffix = '',
    backSuffix = '',
    nextStudyDate = undefined,
  }: {
    frontSuffix?: string
    backSuffix?: string
    nextStudyDate?: Date
  } = {},
) => ({
  id,
  deckId,
  studiedBy: testUserId,
  frontContent: `テスト用フロント${frontSuffix}`,
  backContent: `テスト用バック${backSuffix}`,
  ...(nextStudyDate && { nextStudyDate }),
})

// デッキ1のカード
// 学習予定日が過去（学習対象）
const pastDueCardsDeck1 = Array.from({ length: 5 }, () => uuidv7()).map((id) =>
  createTestCard(id, testDeckId1, {
    frontSuffix: '1（学習対象）',
    backSuffix: '1（学習対象）',
    nextStudyDate: subDays(new Date(), 10),
  }),
)

// 学習予定日が未来（学習対象外）
const futureDueCardsDeck1 = Array.from({ length: 3 }, () => uuidv7()).map((id) =>
  createTestCard(id, testDeckId1, {
    frontSuffix: '1（学習対象外）',
    backSuffix: '1（学習対象外）',
    nextStudyDate: addDays(new Date(), 10),
  }),
)

// 学習状態がない（学習対象）
const newCardsDeck1 = Array.from({ length: 4 }, () => uuidv7()).map((id) =>
  createTestCard(id, testDeckId1, {
    frontSuffix: '1（学習対象&未学習）',
    backSuffix: '1（学習対象&未学習）',
  }),
)

// デッキ2のカード
// 学習予定日が過去（学習対象）
const pastDueCardsDeck2 = Array.from({ length: 2 }, () => uuidv7()).map((id) =>
  createTestCard(id, testDeckId2, {
    frontSuffix: '2（学習対象）',
    backSuffix: '2（学習対象）',
    nextStudyDate: subDays(new Date(), 10),
  }),
)

// 学習予定日が未来（学習対象外）
const futureDueCardsDeck2 = Array.from({ length: 2 }, () => uuidv7()).map((id) =>
  createTestCard(id, testDeckId2, {
    frontSuffix: '2（学習対象外）',
    backSuffix: '2（学習対象外）',
    nextStudyDate: addDays(new Date(), 10),
  }),
)

// 学習状態がない（学習対象）
const newCardsDeck2 = Array.from({ length: 3 }, () => uuidv7()).map((id) =>
  createTestCard(id, testDeckId2, {
    frontSuffix: '2（学習対象&未学習）',
    backSuffix: '2（学習対象&未学習）',
  }),
)

// 学習予定日が設定されているカード（過去と未来両方）
const cardsWithStudyDates = [...pastDueCardsDeck1, ...pastDueCardsDeck2, ...futureDueCardsDeck1, ...futureDueCardsDeck2]

// テスト用のすべてのカード
const allTestCards = [...cardsWithStudyDates, ...newCardsDeck1, ...newCardsDeck2]

// 学習対象となるべきカードのID
const expectedStudyableCardIds = [
  ...pastDueCardsDeck1.map((card) => card.id),
  ...pastDueCardsDeck2.map((card) => card.id),
  ...newCardsDeck1.map((card) => card.id),
  ...newCardsDeck2.map((card) => card.id),
]

// デッキ1の学習対象カードのID
const expectedStudyableCardIdsForDeck1 = [
  ...pastDueCardsDeck1.map((card) => card.id),
  ...newCardsDeck1.map((card) => card.id),
]

// 未学習カードのID
const expectedNewCardIds = [...newCardsDeck1.map((card) => card.id), ...newCardsDeck2.map((card) => card.id)]

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
      count: 2,
      columns: {
        id: f.valuesFromArray({ values: [testDeckId1, testDeckId2], isUnique: true }),
        name: f.valuesFromArray({ values: ['テストデッキ1', 'テストデッキ2'], isUnique: true }),
        description: f.valuesFromArray({ values: ['テスト用デッキ1', 'テスト用デッキ2'], isUnique: true }),
        createdBy: f.default({ defaultValue: testUserId }),
      },
    },
  }))

  const db = getSetupClient()

  // カードデータの挿入
  await db.insert(cardSchema.cardsTable).values(allTestCards)

  // 学習状態データの挿入（学習予定日があるカードのみ）
  await db.insert(cardSchema.cardLearningStatesTable).values(
    cardsWithStudyDates
      .filter((card) => card.nextStudyDate)
      .map((card) => {
        const nextStudyDate = card.nextStudyDate as Date
        const isPastDue = nextStudyDate < new Date()

        return {
          cardId: card.id,
          studiedBy: testUserId,
          nextStudyDate: nextStudyDate,
          easeFactor: 2.5,
          interval: isPastDue ? 1 : 5, // 過去なら短い間隔、未来なら長い間隔
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }),
  )
})

afterEach(async () => {
  await reset(getSetupClient(), {
    ...userSchema,
    ...deckSchema,
    ...cardSchema,
  })
})

// アサーション用のヘルパー関数
const validateCardIds = (actualCards: Card[], expectedCardIds: string[]) => {
  const actualIds = actualCards.map((card) => card.id).sort()
  const expectedIds = [...expectedCardIds].sort()
  expect(actualIds).toEqual(expectedIds)
}

describe('fetchDueCards', () => {
  // 学習予定日が今日以前のカードと未学習カードを取得できること
  it.effect('学習予定日が今日以前のカードと未学習カードを取得できること', () =>
    pipe(
      Effect.gen(function* () {
        expect.assertions(1)

        // Act
        const result = yield* fetchDueCards({
          userId: testUserId,
        })

        // Assert
        validateCardIds(result, expectedStudyableCardIds)
      }),
      Effect.provide(getTestDriver()),
    ),
  )

  // デッキIDを指定した場合、そのデッキの学習対象カードのみを取得できること
  it.effect('デッキIDを指定した場合、そのデッキの学習対象カードのみを取得できること', () =>
    pipe(
      Effect.gen(function* () {
        expect.assertions(1)

        // Act
        const result = yield* fetchDueCards({
          userId: testUserId,
          deckId: testDeckId1,
        })

        // Assert
        validateCardIds(result, expectedStudyableCardIdsForDeck1)
      }),
      Effect.provide(getTestDriver()),
    ),
  )

  // リミットを指定した場合、指定した数のカードのみを取得できること
  it.effect('リミットを指定した場合、指定した数のカードのみを取得できること', () =>
    pipe(
      Effect.gen(function* () {
        expect.assertions(1)

        // Arrange
        const limit = 3

        // Act
        const result = yield* fetchDueCards({
          userId: testUserId,
          limit,
        })

        // Assert
        expect(result.length).toEqual(limit)
      }),
      Effect.provide(getTestDriver()),
    ),
  )

  // まだ一度も学習していないカードも取得できること
  it.effect('まだ一度も学習していないカードも取得できること', () =>
    pipe(
      Effect.gen(function* () {
        expect.assertions(1)

        // Act
        const result = yield* fetchDueCards({
          userId: testUserId,
        })

        // Assert
        // 結果に未学習カードが少なくとも1つ含まれていること
        expect(result.some((card) => expectedNewCardIds.includes(card.id))).toBe(true)
      }),
      Effect.provide(getTestDriver()),
    ),
  )
})
