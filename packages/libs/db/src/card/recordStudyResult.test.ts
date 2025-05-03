import { afterEach, beforeEach, describe, expect, it } from '@effect/vitest'
import type { CardStudy } from '@kizamu/schema'
import { addDays } from 'date-fns'
import { and, eq } from 'drizzle-orm'
import { reset, seed } from 'drizzle-seed'
import { Effect, Exit, pipe } from 'effect'
import { uuidv7 } from 'uuidv7'
import { getSetupClient, getTestDriver } from '../../test/setupClient'
import * as deckSchema from '../deck/deck.sql'
import { NotFoundDeckError } from '../deck/error'
import { NotFoundUserError } from '../user/error'
import * as userSchema from '../user/user.sql'
import * as cardSchema from './card.sql'
import { NotFoundCardError } from './error'
import { recordStudyResult } from './recordStudyResult'

// テスト用の定数
const testUserId = uuidv7()
const testDeckId = uuidv7()
const testCardId = uuidv7()
const nonExistentCardId = uuidv7()
const nonExistentDeckId = uuidv7()
const nonExistentUserId = uuidv7()
const studyEventId = uuidv7()

// テスト用のカード学習データを作成するヘルパー関数
const createTestCardStudy = (
  options: {
    id?: string
    cardId?: string
    studiedBy?: string
    deckId?: string
    grade?: number
    easeFactor?: number
    interval?: number
  } = {},
): CardStudy => {
  const studiedAt = new Date()
  const nextStudyDate = addDays(studiedAt, options.interval || 1)

  return {
    id: options.id || studyEventId,
    cardId: options.cardId || testCardId,
    studiedBy: options.studiedBy || testUserId,
    deckId: options.deckId || testDeckId,
    studiedAt,
    grade: options.grade !== undefined ? options.grade : 3,
    learningProgress: {
      easeFactor: options.easeFactor !== undefined ? options.easeFactor : 2.5,
      interval: options.interval !== undefined ? options.interval : 1,
      nextStudyDate,
    },
  }
}

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

  // カードデータを1件だけ挿入
  await db.insert(cardSchema.cardsTable).values({
    id: testCardId,
    deckId: testDeckId,
    createdBy: testUserId,
    frontContent: 'テスト用フロント',
    backContent: 'テスト用バック',
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

describe('recordStudyResult', () => {
  // 新規の学習状態を記録する場合、DBに正しく保存されること
  it.effect('新規の学習状態を記録する場合、DBに正しく保存されること', () =>
    pipe(
      Effect.gen(function* () {
        expect.assertions(7)

        // Arrange
        const cardStudy = createTestCardStudy()

        // Act
        const result = yield* recordStudyResult(cardStudy)

        // Assert
        expect(result).toEqual(cardStudy)

        // 学習イベントと学習状態の両方が保存されていることを確認
        const db = getSetupClient()

        // 学習イベントの確認
        const savedStudyEvent = yield* Effect.promise(() =>
          db
            .select()
            .from(cardSchema.studyEventsTable)
            .where(eq(cardSchema.studyEventsTable.id, studyEventId))
            .execute(),
        )
        expect(savedStudyEvent.length).toEqual(1)
        expect(savedStudyEvent[0].grade).toEqual(cardStudy.grade)

        // カード学習状態の確認
        const savedCardLearningState = yield* Effect.promise(() =>
          db
            .select()
            .from(cardSchema.cardLearningStatesTable)
            .where(
              and(
                eq(cardSchema.cardLearningStatesTable.cardId, testCardId),
                eq(cardSchema.cardLearningStatesTable.studiedBy, testUserId),
              ),
            )
            .execute(),
        )
        expect(savedCardLearningState.length).toEqual(1)
        expect(savedCardLearningState[0].easeFactor).toEqual(cardStudy.learningProgress.easeFactor)
        expect(savedCardLearningState[0].interval).toEqual(cardStudy.learningProgress.interval)
        expect(savedCardLearningState[0].nextStudyDate).toEqual(cardStudy.learningProgress.nextStudyDate)
      }),
      Effect.provide(getTestDriver()),
    ),
  )

  // 既存の学習状態がある場合、正しく更新されること
  it.effect('既存の学習状態がある場合、正しく更新されること', () =>
    pipe(
      Effect.gen(function* () {
        expect.assertions(5)

        // Arrange
        const initialCardStudy = createTestCardStudy({
          easeFactor: 2.5,
          interval: 1,
        })

        // 最初の学習記録を保存
        yield* recordStudyResult(initialCardStudy)

        // 同じカードの2回目の学習（パラメータが変わる）
        const updatedCardStudy = createTestCardStudy({
          id: uuidv7(), // 別の学習イベントID
          easeFactor: 2.2, // 難易度が下がった
          interval: 4, // 間隔が伸びた
        })

        // Act
        const result = yield* recordStudyResult(updatedCardStudy)

        // Assert
        expect(result).toEqual(updatedCardStudy)

        // 更新された学習状態を確認
        const db = getSetupClient()
        const learningState = yield* Effect.promise(() =>
          db
            .select()
            .from(cardSchema.cardLearningStatesTable)
            .where(
              and(
                eq(cardSchema.cardLearningStatesTable.cardId, testCardId),
                eq(cardSchema.cardLearningStatesTable.studiedBy, testUserId),
              ),
            )
            .execute(),
        )

        expect(learningState.length).toEqual(1)
        expect(learningState[0].interval).toEqual(updatedCardStudy.learningProgress.interval)
        expect(learningState[0].easeFactor).toEqual(updatedCardStudy.learningProgress.easeFactor)
        expect(learningState[0].nextStudyDate).toEqual(updatedCardStudy.learningProgress.nextStudyDate)
      }),
      Effect.provide(getTestDriver()),
    ),
  )

  // 存在しないカードIDの場合、NotFoundCardErrorが返されること
  it.effect('存在しないカードIDの場合、NotFoundCardErrorが返されること', () =>
    pipe(
      Effect.gen(function* () {
        expect.assertions(1)

        // Arrange
        const cardStudy = createTestCardStudy({
          cardId: nonExistentCardId,
        })

        // Act
        const result = yield* Effect.exit(recordStudyResult(cardStudy))

        // Assert
        if (Exit.isFailure(result) && result.cause._tag === 'Fail') {
          expect(result.cause.error).toBeInstanceOf(NotFoundCardError)
        }
      }),
      Effect.provide(getTestDriver()),
    ),
  )

  // 存在しないデッキIDの場合、NotFoundDeckErrorが返されること
  it.effect('存在しないデッキIDの場合、NotFoundDeckErrorが返されること', () =>
    pipe(
      Effect.gen(function* () {
        expect.assertions(1)

        // Arrange
        const cardStudy = createTestCardStudy({
          deckId: nonExistentDeckId,
        })

        // Act
        const result = yield* Effect.exit(recordStudyResult(cardStudy))

        // Assert
        if (Exit.isFailure(result) && result.cause._tag === 'Fail') {
          expect(result.cause.error).toBeInstanceOf(NotFoundDeckError)
        }
      }),
      Effect.provide(getTestDriver()),
    ),
  )

  // 存在しないユーザーIDの場合、NotFoundUserErrorが返されること
  it.effect('存在しないユーザーIDの場合、NotFoundUserErrorが返されること', () =>
    pipe(
      Effect.gen(function* () {
        expect.assertions(1)

        // Arrange
        const cardStudy = createTestCardStudy({
          studiedBy: nonExistentUserId,
        })

        // Act
        const result = yield* Effect.exit(recordStudyResult(cardStudy))

        // Assert
        if (Exit.isFailure(result) && result.cause._tag === 'Fail') {
          expect(result.cause.error).toBeInstanceOf(NotFoundUserError)
        }
      }),
      Effect.provide(getTestDriver()),
    ),
  )
})
