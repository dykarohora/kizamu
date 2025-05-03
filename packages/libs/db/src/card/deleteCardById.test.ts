import { afterEach, beforeEach, describe, expect, it } from '@effect/vitest'
import { eq } from 'drizzle-orm'
import { reset, seed } from 'drizzle-seed'
import { Effect, Exit, pipe } from 'effect'
import { uuidv7 } from 'uuidv7'
import { getSetupClient, getTestDriver } from '../../test/setupClient'
import * as deckSchema from '../deck/deck.sql'
import * as userSchema from '../user/user.sql'
import * as cardSchema from './card.sql'
import { deleteCardById } from './deleteCardById'
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

  // 学習イベントデータを挿入
  await db.insert(cardSchema.studyEventsTable).values({
    id: uuidv7(),
    deckId: testDeckId,
    studiedBy: testUserId,
    cardId: testCardId,
    grade: 3,
    studiedAt: new Date(),
  })

  // 学習状態データを挿入
  await db.insert(cardSchema.cardLearningStatesTable).values({
    cardId: testCardId,
    studiedBy: testUserId,
    easeFactor: 2.5,
    interval: 1,
    nextStudyDate: new Date(),
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

describe('deleteCardById', () => {
  // 存在するカードIDが与えられた場合に、カードが正常に削除されること
  it.effect('存在するカードIDが与えられた場合に、カードが正常に削除されること', () =>
    pipe(
      Effect.gen(function* () {
        expect.assertions(1)

        // Act
        yield* deleteCardById(testCardId)

        // この時点でエラーがなければテスト成功
        expect(true).toBe(true)
      }),
      Effect.provide(getTestDriver()),
    ),
  )

  // 存在しないカードIDが与えられた場合に、NotFoundCardErrorが返されること
  it.effect('存在しないカードIDが与えられた場合に、NotFoundCardErrorが返されること', () =>
    pipe(
      Effect.gen(function* () {
        expect.assertions(1)

        // Act & Assert
        const result = yield* Effect.exit(deleteCardById(nonExistentCardId))

        if (Exit.isFailure(result) && result.cause._tag === 'Fail') {
          expect(result.cause.error).toBeInstanceOf(NotFoundCardError)
        }
      }),
      Effect.provide(getTestDriver()),
    ),
  )

  // カード削除時に関連するstudyEventsTableのレコードも一緒に削除されること
  it.effect('カード削除時に関連するstudyEventsTableのレコードも一緒に削除されること', () =>
    pipe(
      Effect.gen(function* () {
        expect.assertions(1)

        // Act
        yield* deleteCardById(testCardId)

        // データ検証のためにあえてテスト後にデータベース直接アクセス
        const events = yield* Effect.promise(() => {
          const db = getSetupClient()
          return db.select().from(cardSchema.studyEventsTable).where(eq(cardSchema.studyEventsTable.cardId, testCardId))
        })

        // Assert
        expect(events.length).toBe(0)
      }),
      Effect.provide(getTestDriver()),
    ),
  )

  // カード削除時に関連するcardLearningStatesTableのレコードも一緒に削除されること
  it.effect('カード削除時に関連するcardLearningStatesTableのレコードも一緒に削除されること', () =>
    pipe(
      Effect.gen(function* () {
        expect.assertions(1)

        // Act
        yield* deleteCardById(testCardId)

        // データ検証のためにあえてテスト後にデータベース直接アクセス
        const learningStates = yield* Effect.promise(() => {
          const db = getSetupClient()
          return db
            .select()
            .from(cardSchema.cardLearningStatesTable)
            .where(eq(cardSchema.cardLearningStatesTable.cardId, testCardId))
        })

        // Assert
        expect(learningStates.length).toBe(0)
      }),
      Effect.provide(getTestDriver()),
    ),
  )
})
