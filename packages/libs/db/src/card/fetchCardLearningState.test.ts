import { afterEach, beforeEach, describe, expect, it } from '@effect/vitest'
import type { LearningProgress } from '@kizamu/schema'
import { reset, seed } from 'drizzle-seed'
import { Effect, pipe } from 'effect'
import { uuidv7 } from 'uuidv7'
import { getSetupClient, getTestDriver } from '../../test/setupClient'
import * as deckSchema from '../deck/deck.sql'
import * as userSchema from '../user/user.sql'
import * as cardSchema from './card.sql'
import { fetchCardLearningState } from './fetchCardLearningState'

// テスト用の定数
const testUserId = uuidv7()
const anotherUserId = uuidv7()
const testDeckId = uuidv7()
const cardWithLearningStateId = uuidv7()
const cardWithoutLearningStateId = uuidv7()

// テストデータのセットアップ
beforeEach(async () => {
  await seed(getSetupClient(), {
    ...userSchema,
    ...deckSchema,
  }).refine((f) => ({
    // ユーザーデータ
    usersTable: {
      count: 2,
      columns: {
        id: f.valuesFromArray({ values: [testUserId, anotherUserId], isUnique: true }),
        name: f.valuesFromArray({ values: ['テストユーザー1', 'テストユーザー2'], isUnique: true }),
        email: f.valuesFromArray({ values: ['test1@example.com', 'test2@example.com'], isUnique: true }),
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

  // カードデータを2件挿入（学習状態あり、学習状態なし）
  await db.insert(cardSchema.cardsTable).values([
    {
      id: cardWithLearningStateId,
      deckId: testDeckId,
      frontContent: '学習状態あり表面',
      backContent: '学習状態あり裏面',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: cardWithoutLearningStateId,
      deckId: testDeckId,
      frontContent: '学習状態なし表面',
      backContent: '学習状態なし裏面',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ])

  // 学習状態データを1件だけ挿入
  const learningState: LearningProgress = {
    easeFactor: 2.3,
    interval: 5,
    nextStudyDate: new Date('2023-05-15T00:00:00Z'),
  }

  await db.insert(cardSchema.cardLearningStatesTable).values({
    cardId: cardWithLearningStateId,
    studiedBy: testUserId,
    easeFactor: learningState.easeFactor,
    interval: learningState.interval,
    nextStudyDate: learningState.nextStudyDate,
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

describe('fetchCardLearningState', () => {
  // 学習履歴が存在する場合に正しい学習状態を取得できること
  it.effect('学習履歴が存在する場合に fetchCardLearningState を実行すると正しい LearningProgress が返されること', () =>
    pipe(
      Effect.gen(function* () {
        expect.assertions(4)

        // Act
        const result = yield* fetchCardLearningState({
          cardId: cardWithLearningStateId,
          userId: testUserId,
        })

        // Assert
        expect(result).toBeDefined()
        if (result) {
          expect(result.easeFactor).toEqual(2.3)
          expect(result.interval).toEqual(5)
          expect(result.nextStudyDate).toEqual(new Date('2023-05-15T00:00:00Z'))
        }
      }),
      Effect.provide(getTestDriver()),
    ),
  )

  // 学習履歴が存在しない場合にundefinedを返すこと
  it.effect('学習履歴が存在しない場合に fetchCardLearningState を実行すると undefined が返されること', () =>
    pipe(
      Effect.gen(function* () {
        expect.assertions(2)

        // Case 1: 学習状態がないカード
        const result1 = yield* fetchCardLearningState({
          cardId: cardWithoutLearningStateId,
          userId: testUserId,
        })

        // Case 2: 別のユーザーで学習状態のあるカードを確認
        const result2 = yield* fetchCardLearningState({
          cardId: cardWithLearningStateId,
          userId: anotherUserId,
        })

        // Assert
        expect(result1).toBeUndefined()
        expect(result2).toBeUndefined()
      }),
      Effect.provide(getTestDriver()),
    ),
  )
})
